import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getUsineStatistics } from '../services/api';
import {
  ShopOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  PhoneOutlined,
  GlobalOutlined,
  AimOutlined,
  BuildOutlined,
} from '@ant-design/icons';

const COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];

function DashboardUsine({ active }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsineStatistics();
      setStats(data);
      setHasLoaded(true);
    } catch (err) {
      console.error('Error loading usine statistics:', err);
      setError(err.message || 'Échec du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active && !hasLoaded) {
      loadStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, hasLoaded]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Erreur lors du chargement des statistiques"
        description={error}
        type="error"
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare data for charts
  const cityData = (stats.topCities || []).map(item => ({
    city: item.city,
    count: item.count,
  }));

  const keywordData = (stats.topKeywords || []).map(item => ({
    keyword: item.keyword,
    count: item.count,
  }));

  const completenessData = [
    { 
      name: 'Téléphone', 
      value: parseFloat(stats.completenessPercentage?.phone || '0'),
      count: stats.withPhone || 0
    },
    { 
      name: 'Site Web', 
      value: parseFloat(stats.completenessPercentage?.website || '0'),
      count: stats.withWebsite || 0
    },
    { 
      name: 'Coordonnées GPS', 
      value: parseFloat(stats.completenessPercentage?.coordinates || '0'),
      count: stats.withCoordinates || 0
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Overview KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Usines"
              value={stats.total || 0}
              prefix={<BuildOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avec Téléphone"
              value={stats.withPhone || 0}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avec Site Web"
              value={stats.withWebsite || 0}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avec Coordonnées"
              value={stats.withCoordinates || 0}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 1: Usines par ville & Usines par mot-clé */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<><EnvironmentOutlined /> Usines par Ville</>} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><ShopOutlined /> Usines par Mot-clé</>} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={keywordData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="keyword" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#722ed1" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Data Completeness */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title={<><DatabaseOutlined /> Complétude des Données</>} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={completenessData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="value" fill="#fa8c16">
                  {completenessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Statistic
                  title="Téléphone"
                  value={stats.completenessPercentage?.phone || '0%'}
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Site Web"
                  value={stats.completenessPercentage?.website || '0%'}
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Coordonnées GPS"
                  value={stats.completenessPercentage?.coordinates || '0%'}
                  valueStyle={{ fontSize: '14px', color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

    </div>
  );
}

export default DashboardUsine;

