import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    const result = await login(values.username, values.password);
    setLoading(false);

    if (result.success) {
      message.success('Connexion réussie !');
      navigate('/', { replace: true });
    } else {
      message.error(result.error || 'Erreur lors de la connexion');
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-gradient-orb orb-1"></div>
        <div className="login-gradient-orb orb-2"></div>
        <div className="login-gradient-orb orb-3"></div>
      </div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon-wrapper">
              <SafetyOutlined className="login-icon" />
            </div>
            <Title level={2} className="login-title">
              Bienvenue
            </Title>
            <Text className="login-subtitle">
              Connectez-vous pour accéder à votre espace
            </Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
            className="login-form"
          >
            <Form.Item
              label={<span className="form-label">Nom d'utilisateur</span>}
              name="username"
              rules={[
                {
                  required: true,
                  message: 'Veuillez entrer votre nom d\'utilisateur !',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="Entrez votre nom d'utilisateur"
                autoComplete="username"
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              label={<span className="form-label">Mot de passe</span>}
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Veuillez entrer votre mot de passe !',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                className="login-input"
              />
            </Form.Item>

            <Form.Item className="login-submit-item">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <Text className="login-footer-text">
              Système sécurisé par authentification JWT
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

