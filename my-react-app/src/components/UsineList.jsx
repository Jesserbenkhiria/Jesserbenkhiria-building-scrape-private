import { useState, useEffect } from 'react';
import { Card, Select, Table, Tag, Space, Typography, Button, Input, Row, Col } from 'antd';
import { PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined, SearchOutlined, EyeOutlined, EyeInvisibleOutlined, BuildOutlined } from '@ant-design/icons';
import { getCities, getGoogleMapsKey, getUsineKeywords } from '../services/api';
import CompanyMap from './CompanyMap';

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
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: '14px' }}>
            {text}
          </Text>
          <Tag color={getKeywordColor(record.searchKeyword)}>
            {record.searchKeyword || '—'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Capacité',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 150,
      render: (capacity) => capacity || <Text type="secondary">-</Text>,
    },
    {
      title: 'Produits',
      dataIndex: 'products',
      key: 'products',
      width: 220,
      render: (products) => (
        <Space direction="vertical" size="small" style={{ maxWidth: '100%' }}>
          {products && products.length > 0 ? (
            products.slice(0, 3).map((product, index) => (
              <Tag key={index} style={{ fontSize: '11px' }}>
                {product}
              </Tag>
            ))
          ) : (
            <Text type="secondary">-</Text>
          )}
          {products && products.length > 3 && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              +{products.length - 3} autres
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating) => (typeof rating === 'number' ? rating : <Text type="secondary">-</Text>),
    },
    {
      title: 'Avis',
      dataIndex: 'reviews',
      key: 'reviews',
      width: 100,
      render: (reviews) => (typeof reviews === 'number' ? reviews : <Text type="secondary">-</Text>),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.phones && record.phones.length > 0 ? (
            <Space size="small">
              <PhoneOutlined style={{ color: '#52c41a' }} />
              <Text copyable style={{ fontSize: '12px' }}>
                {record.phones[0]}
              </Text>
            </Space>
          ) : null}
          {record.emails && record.emails.length > 0 ? (
            <Space size="small">
              <MailOutlined style={{ color: '#1890ff' }} />
              <Text copyable style={{ fontSize: '12px' }}>
                {record.emails[0]}
              </Text>
            </Space>
          ) : null}
          {record.website ? (
            <Space size="small">
              <GlobalOutlined style={{ color: '#722ed1' }} />
              <Link href={record.website} target="_blank" style={{ fontSize: '12px' }}>
                Site web
              </Link>
            </Space>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Localisation',
      key: 'location',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.city ? (
            <Space size="small">
              <EnvironmentOutlined style={{ color: '#faad14' }} />
              <Text style={{ fontSize: '12px' }}>{record.city}</Text>
            </Space>
          ) : null}
          {record.address ? (
            <Text type="secondary" style={{ fontSize: '11px', display: 'block', maxWidth: '200px' }} ellipsis>
              {record.address}
            </Text>
          ) : null}
        </Space>
      ),
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

