import { useState, useEffect } from 'react';
import { Card, Select, Table, Tag, Space, Typography, Button, Input, Row, Col, message } from 'antd';
import { PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined, SearchOutlined, EyeOutlined, EyeInvisibleOutlined, BuildOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { getCities, getGoogleMapsKey, getUsineKeywords } from '../services/api';
import CompanyMap from './CompanyMap';
import { convertToCSV, downloadCSV, formatCompaniesForCSV, generateFilename } from '../utils/csvExport';

const { Option } = Select;
const { Text, Link } = Typography;
const { Search } = Input;

function UsineList({ fetchFunction, active }) {
  const [usines, setUsines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cities, setCities] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const loadGoogleMapsKey = async () => {
    try {
      const key = await getGoogleMapsKey();
      setGoogleMapsKey(key);
      console.log('Usines - Google Maps key loaded:', !!key);
      if (!key) {
        console.warn('Usines - Google Maps key is not configured');
      }
    } catch (err) {
      console.error('Usines - Error loading Google Maps key:', err);
      setGoogleMapsKey('');
    }
  };

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      // Récupérer les villes depuis la catégorie construction (pour avoir toutes les villes)
      const cityList = await getCities('construction');
      setCities(cityList);
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadKeywordFilter = async () => {
    try {
      setLoadingKeywords(true);
      const list = await getUsineKeywords();
      setKeywords(list);
    } catch (err) {
      console.error('Error loading usine keywords:', err);
      setKeywords([]);
    } finally {
      setLoadingKeywords(false);
    }
  };

  const loadUsines = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * pageSize;
      const data = await fetchFunction(pageSize, offset, selectedCity, searchQuery, selectedKeyword);
      const usinesData = data.items || [];
      setUsines(usinesData);
      setTotal(data.total || 0);
      
      // Debug: log usines with coordinates
      const usinesWithCoords = usinesData.filter(u => u.lat && u.lng);
      if (usinesWithCoords.length > 0) {
        console.log(`Usines: Found ${usinesWithCoords.length} usines with coordinates`);
      } else {
        console.warn('Usines: No usines with coordinates found');
      }
    } catch (err) {
      setError(err.message || 'Échec du chargement des usines');
      console.error('Error loading usines:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données initiales uniquement si l'onglet est actif et n'a pas encore été chargé
  useEffect(() => {
    if (active && !hasLoaded) {
      loadCities();
      loadGoogleMapsKey();
      loadKeywordFilter();
      loadUsines();
      setHasLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, hasLoaded]);

  // Charger les usines quand les filtres changent
  useEffect(() => {
    if (hasLoaded) {
      loadUsines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, selectedCity, selectedKeyword, searchQuery]);

  const handleCityChange = (value) => {
    setSelectedCity(value);
    setCurrentPage(1);
  };

  const handleKeywordChange = (value) => {
    setSelectedKeyword(value);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchClick = () => {
    handleSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSelectedCity(null);
    setSelectedKeyword(null);
    setSearchQuery('');
    setSearchInput('');
    setCurrentPage(1);
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  // Export current page to CSV
  const handleExportCurrentPage = () => {
    try {
      if (usines.length === 0) {
        message.warning('Aucune donnée à exporter');
        return;
      }

      const formattedData = formatCompaniesForCSV(usines);
      const csvContent = convertToCSV(formattedData);
      const filename = generateFilename(`usines_page_${currentPage}`);
      
      downloadCSV(csvContent, filename);
      message.success(`${usines.length} usines exportées avec succès !`);
    } catch (error) {
      console.error('Error exporting current page:', error);
      message.error('Erreur lors de l\'export');
    }
  };

  // Export all data to CSV
  const handleExportAll = async () => {
    try {
      message.loading('Export en cours...', 0);
      
      // Fetch all data without pagination
      const allData = await fetchFunction(10000, 0, selectedCity, searchQuery, selectedKeyword);
      
      if (!allData.items || allData.items.length === 0) {
        message.destroy();
        message.warning('Aucune donnée à exporter');
        return;
      }

      const formattedData = formatCompaniesForCSV(allData.items);
      const csvContent = convertToCSV(formattedData);
      const filename = generateFilename('usines_complet');
      
      downloadCSV(csvContent, filename);
      message.destroy();
      message.success(`${allData.items.length} usines exportées avec succès !`);
    } catch (error) {
      console.error('Error exporting all data:', error);
      message.destroy();
      message.error('Erreur lors de l\'export complet');
    }
  };

  // Couleur déterministe pour un mot-clé
  const getKeywordColor = (keyword) => {
    if (!keyword) return 'default';
    const palette = ['blue','green','geekblue','purple','magenta','volcano','orange','gold','cyan','lime'];
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
      hash = (hash * 31 + keyword.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  };

  const columns = [
    {
      title: 'Nom de l\'Usine',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Localisation',
      key: 'location',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.address && (
            <Space>
              <EnvironmentOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.address}
              </Text>
            </Space>
          )}
          {record.city && (
            <Tag color="blue">{record.city}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Pays',
      dataIndex: 'country',
      key: 'country',
      width: 120,
      render: (country) => (
        country ? (
          <Tag color="geekblue">{country}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
      sorter: (a, b) => (a.country || '').localeCompare(b.country || ''),
    },
    {
      title: 'Mot-clé',
      dataIndex: 'searchKeyword',
      key: 'searchKeyword',
      width: 180,
      render: (keyword) => (
        keyword ? (
          <Tag color="purple" style={{ fontSize: '11px' }}>
            {keyword}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
      sorter: (a, b) => (a.searchKeyword || '').localeCompare(b.searchKeyword || ''),
    },
    {
      title: 'Téléphone',
      key: 'phones',
      width: 180,
      render: (_, record) => (
        record.phones && record.phones.length > 0 ? (
          <Space direction="vertical" size="small">
            {record.phones.map((phone, idx) => (
              <Link key={idx} href={`tel:${phone}`}>
                <PhoneOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                {phone}
              </Link>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Email',
      key: 'emails',
      width: 200,
      render: (_, record) => (
        record.emails && record.emails.length > 0 ? (
          <Space direction="vertical" size="small">
            {record.emails.map((email, idx) => (
              <Link key={idx} href={`mailto:${email}`}>
                <MailOutlined style={{ color: '#fa8c16', marginRight: 4 }} />
                {email}
              </Link>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Site Web',
      key: 'website',
      width: 200,
      render: (_, record) => (
        record.website ? (
          <Link
            href={record.website}
            target="_blank"
            rel="noopener noreferrer"
            ellipsis
          >
            <GlobalOutlined style={{ color: '#1890ff', marginRight: 4 }} />
            {record.website}
          </Link>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Liens Sociaux',
      key: 'social',
      width: 150,
      render: (_, record) => (
        record.social && record.social.length > 0 ? (
          <Space direction="vertical" size="small">
            {record.social.slice(0, 2).map((link, idx) => (
              <Link
                key={idx}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11px' }}
                ellipsis
              >
                🔗 {link.length > 25 ? `${link.substring(0, 25)}...` : link}
              </Link>
            ))}
            {record.social.length > 2 && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                +{record.social.length - 2} de plus
              </Text>
            )}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Confiance',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      align: 'center',
      render: (confidence) => (
        confidence ? (
          <Tag color={confidence >= 0.7 ? 'green' : confidence >= 0.5 ? 'orange' : 'red'}>
            {Math.round(confidence * 100)}%
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
      sorter: (a, b) => (a.confidence || 0) - (b.confidence || 0),
    },
  ];

  return (
    <div className="company-list">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Total */}
          <Row>
            <Col>
              <Text strong style={{ fontSize: '16px' }}>Total: {total} usines</Text>
            </Col>
          </Row>

          {/* Filtres */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filtrer par ville"
                allowClear
                showSearch
                loading={loadingCities}
                value={selectedCity}
                onChange={handleCityChange}
                style={{ width: '100%' }}
              >
                {cities.map((city) => (
                  <Option key={city} value={city}>
                    {city}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filtrer par mot-clé"
                allowClear
                showSearch
                loading={loadingKeywords}
                value={selectedKeyword}
                onChange={handleKeywordChange}
                style={{ width: '100%' }}
              >
                {keywords.map((kw) => (
                  <Option key={kw} value={kw}>
                    {kw}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Input.Group compact style={{ display: 'flex' }}>
                <Input
                  placeholder="Rechercher..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onPressEnter={handleSearchClick}
                  style={{ flex: 1 }}
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchClick} />
              </Input.Group>
            </Col>
          </Row>

          {/* Actions */}
          <Row gutter={16}>
            <Col>
              <Button onClick={handleClearFilters}>
                Effacer les filtres
              </Button>
            </Col>
            <Col>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExportCurrentPage}
                disabled={usines.length === 0}
              >
                Exporter Page
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleExportAll}
                disabled={total === 0}
              >
                Exporter Tout ({total})
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={showMap ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={toggleMap}
              >
                {showMap ? 'Masquer' : 'Afficher'} la carte
              </Button>
            </Col>
          </Row>

          {/* Carte */}
          {showMap && googleMapsKey && (
            <CompanyMap
              companies={usines}
              googleMapsKey={googleMapsKey}
              category="usine"
            />
          )}

          {/* Erreur */}
          {error && (
            <div className="error-message" style={{ color: 'red', padding: '10px', background: '#fff2f0', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          {/* Tableau */}
          <Table
            columns={columns}
            dataSource={usines}
            loading={loading}
            rowKey={(record, index) => index}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} usines`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  );
}

export default UsineList;

