import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Typography, Tabs } from 'antd';
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
import { getCategoryStatistics } from '../services/api';
import DashboardUsine from './DashboardUsine';
import {
  ShopOutlined,
  AimOutlined,
  EnvironmentOutlined,
  TagOutlined,
  TrophyOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  BuildOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d', '#faad14'];

function DashboardTab({ category, active }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategoryStatistics(category);
      setStats(data);
      setHasLoaded(true);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError(err.message || 'Échec du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger les statistiques uniquement si l'onglet est actif et n'a pas encore été chargé
    if (active && !hasLoaded) {
      loadStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, active, hasLoaded]);

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
  const cityData = stats.companiesByCity.slice(0, 20).map(item => ({
    city: item.city,
    count: item.count,
  }));

  const keywordData = stats.companiesByKeyword.slice(0, 20).map(item => ({
    keyword: item.keyword,
    count: item.count,
  }));

  const completenessData = [
    { name: 'Téléphone', value: parseFloat(stats.completeness.phone), count: stats.completeness.phoneCount },
    { name: 'Email', value: parseFloat(stats.completeness.email), count: stats.completeness.emailCount },
    { name: 'Site Web', value: parseFloat(stats.completeness.website), count: stats.completeness.websiteCount },
    { name: 'Réseaux Sociaux', value: parseFloat(stats.completeness.social), count: stats.completeness.socialCount },
  ];


  // Utiliser les données préparées par le backend
  const crossAnalysisChartData = stats.crossAnalysisChart || [];
  const topKeywords = stats.crossAnalysisTopKeywords || [];

  return (
    <div style={{ padding: '24px' }}>
      {/* Overview KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Entreprises"
              value={stats.total}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Confiance Moyenne"
              value={stats.avgConfidence}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Score de Contactabilité"
              value={stats.contactabilityScore}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              {stats.contactabilityCount} / {stats.total} entreprises
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avec Coordonnées"
              value={stats.companiesWithCoords.length}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 1: Companies per city & Companies per keyword */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<><EnvironmentOutlined /> Entreprises par Ville</>} style={{ height: '100%' }}>
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
          <Card title={<><TagOutlined /> Entreprises par Mot-clé de Recherche</>} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={keywordData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="keyword" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#52c41a" />
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
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="value" fill="#fa8c16">
                  {completenessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Statistic
                  title="Téléphone"
                  value={stats.completeness.phone}
                  suffix="%"
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Email"
                  value={stats.completeness.email}
                  suffix="%"
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Site Web"
                  value={stats.completeness.website}
                  suffix="%"
                  valueStyle={{ fontSize: '14px', color: '#fa8c16' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Réseaux Sociaux"
                  value={stats.completeness.social}
                  suffix="%"
                  valueStyle={{ fontSize: '14px', color: '#eb2f96' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Cross Analysis Chart - Keywords per City */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={<><BarChartOutlined /> Analyse Croisée : Mots-clés par Ville</>}>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={crossAnalysisChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="city" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                />
                {topKeywords.map((keyword, index) => (
                  <Bar 
                    key={keyword}
                    dataKey={keyword} 
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                    name={keyword}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function Dashboard({ active }) {
  const [activeTab, setActiveTab] = useState('construction');
  
  // Ne charger le dashboard que s'il est actif
  if (!active) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ color: '#ffffff', marginBottom: 24 }}>
        📊 Dashboard Statistiques
      </Title>

      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card" 
        size="large"
        items={[
          {
            key: 'construction',
            label: (
              <span>
                <ShopOutlined />
                Construction
              </span>
            ),
            children: <DashboardTab category="construction" active={activeTab === 'construction'} />,
          },
          {
            key: 'fournisseur',
            label: (
              <span>
                <ShopOutlined />
                Fournisseur
              </span>
            ),
            children: <DashboardTab category="fournisseur" active={activeTab === 'fournisseur'} />,
          },
          {
            key: 'usine',
            label: (
              <span>
                <BuildOutlined />
                Usines
              </span>
            ),
            children: <DashboardUsine active={activeTab === 'usine'} />,
          },
        ]}
      />
    </div>
  );
}

export default Dashboard;
