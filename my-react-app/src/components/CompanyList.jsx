import { useState, useEffect } from 'react';
import { Card, Select, Table, Tag, Space, Typography, Button, Input, Row, Col, message } from 'antd';
import { PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined, SearchOutlined, EyeOutlined, EyeInvisibleOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { getCities, getGoogleMapsKey, getKeywords } from '../services/api';
import CompanyMap from './CompanyMap';
import { convertToCSV, downloadCSV, formatCompaniesForCSV, generateFilename } from '../utils/csvExport';

const { Option } = Select;
const { Text, Link } = Typography;
const { Search } = Input;

function CompanyList({ fetchFunction, category, active }) {
  const [companies, setCompanies] = useState([]);
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
      console.log(`${category} - Google Maps key loaded:`, !!key);
      if (!key) {
        console.warn(`${category} - Google Maps key is not configured`);
      }
    } catch (err) {
      console.error(`${category} - Error loading Google Maps key:`, err);
      setGoogleMapsKey('');
    }
  };

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const cityList = await getCities(category);
      setCities(cityList);
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadKeywords = async () => {
    try {
      setLoadingKeywords(true);
      const keywordList = await getKeywords(category);
      setKeywords(keywordList);
    } catch (err) {
      console.error('Error loading keywords:', err);
      setKeywords([]);
    } finally {
      setLoadingKeywords(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * pageSize;
      const data = await fetchFunction(pageSize, offset, selectedCity, searchQuery, selectedKeyword);
      const companiesData = data.items || [];
      setCompanies(companiesData);
      setTotal(data.total || 0);
      
      // Debug: log companies with coordinates
      const companiesWithCoords = companiesData.filter(c => c.lat && c.lng);
      if (companiesWithCoords.length > 0) {
        console.log(`${category}: Found ${companiesWithCoords.length} companies with coordinates`);
      } else {
        console.warn(`${category}: No companies with coordinates found`);
      }
    } catch (err) {
      setError(err.message || 'Échec du chargement des entreprises');
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données initiales uniquement si l'onglet est actif et n'a pas encore été chargé
  useEffect(() => {
    if (active && !hasLoaded) {
      loadCities();
      loadGoogleMapsKey();
      loadKeywords();
      loadCompanies();
      setHasLoaded(true);
    }
  }, [category, active, hasLoaded]);

  // Charger Google Maps key une seule fois
  useEffect(() => {
    if (active && !googleMapsKey) {
      loadGoogleMapsKey();
    }
  }, [active, googleMapsKey]);

  // Recharger les entreprises quand les filtres changent (seulement si actif)
  useEffect(() => {
    if (active && hasLoaded) {
      loadCompanies();
    }
  }, [currentPage, pageSize, selectedCity, selectedKeyword, searchQuery, active, hasLoaded]);

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
    setSearchInput(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    if (!e.target.value) {
      handleSearch('');
    }
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Export current page to CSV
  const handleExportCurrentPage = () => {
    try {
      if (companies.length === 0) {
        message.warning('Aucune donnée à exporter');
        return;
      }

      const formattedData = formatCompaniesForCSV(companies);
      const csvContent = convertToCSV(formattedData);
      const filename = generateFilename(`${category}_page_${currentPage}`);
      
      downloadCSV(csvContent, filename);
      message.success(`${companies.length} entreprises exportées avec succès !`);
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
      const filename = generateFilename(`${category}_complet`);
      
      downloadCSV(csvContent, filename);
      message.destroy();
      message.success(`${allData.items.length} entreprises exportées avec succès !`);
    } catch (error) {
      console.error('Error exporting all data:', error);
      message.destroy();
      message.error('Erreur lors de l\'export complet');
    }
  };

  const columns = [
    {
      title: 'Nom de l\'Entreprise',
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
    <div className="company-list-container">
      <Card
        title={
          <Space>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>
              {category === 'construction' ? '🏗️' : '📦'} Entreprises
            </span>
            {!loading && (
              <Tag color="default" style={{ fontSize: '12px' }}>
                {total} au total
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space wrap>
            <Search
              placeholder="Rechercher par nom, adresse ou site web"
              allowClear
              style={{ width: 300 }}
              value={searchInput}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
            <Select
              placeholder="Filtrer par Ville"
              allowClear
              style={{ width: 180 }}
              value={selectedCity}
              onChange={handleCityChange}
              loading={loadingCities}
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {cities.map(city => (
                <Option key={city} value={city}>
                  {city}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filtrer par Mot-clé"
              allowClear
              style={{ width: 220 }}
              value={selectedKeyword}
              onChange={handleKeywordChange}
              loading={loadingKeywords}
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {keywords.map(keyword => (
                <Option key={keyword} value={keyword}>
                  {keyword}
                </Option>
              ))}
            </Select>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleExportCurrentPage}
              disabled={companies.length === 0}
            >
              Exporter Page
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportAll}
              disabled={total === 0}
            >
              Exporter Tout ({total})
            </Button>
            {googleMapsKey && companies.some(c => c.lat && c.lng) && (
              <Button
                type={showMap ? 'default' : 'primary'}
                icon={showMap ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? 'Masquer la Carte' : 'Afficher la Carte'}
              </Button>
            )}
          </Space>
        }
        style={{ 
          marginBottom: 16,
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          background: '#1f1f1f',
          border: '1px solid #434343'
        }}
      >
        {error && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Text type="danger">{error}</Text>
              <Button size="small" onClick={loadCompanies}>
                Réessayer
              </Button>
            </Space>
          </div>
        )}
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={showMap && googleMapsKey && companies.some(c => c.lat && c.lng) ? 14 : 24}>
          <Card
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              background: '#1f1f1f',
              border: '1px solid #434343'
            }}
          >
            <Table
              columns={columns}
              dataSource={companies}
              rowKey={(record, index) => `${record.name}-${index}`}
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} sur ${total} entreprises`,
                pageSizeOptions: ['10', '20', '50', '100'],
                position: ['topRight'],
              }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </Card>
        </Col>
        {showMap && googleMapsKey && companies.some(c => c.lat && c.lng) && (
          <Col xs={24} lg={10}>
            <CompanyMap companies={companies} apiKey={googleMapsKey} />
          </Col>
        )}
      </Row>
    </div>
  );
}

export default CompanyList;
