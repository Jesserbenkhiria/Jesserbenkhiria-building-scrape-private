import { Card, Tag, Space, Typography } from 'antd';
import { PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Text, Link } = Typography;

function CompanyCard({ company }) {
  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ marginBottom: 12 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: '16px', flex: 1 }}>
            {company.name}
          </Text>
          {company.confidence && (
            <Tag color="purple">
              {Math.round(company.confidence * 100)}%
            </Tag>
          )}
        </Space>
      </div>

      {company.address && (
        <div style={{ marginBottom: 8 }}>
          <Space>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {company.address}
              {company.city && `, ${company.city}`}
            </Text>
          </Space>
        </div>
      )}

      {company.phones && company.phones.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {company.phones.map((phone, idx) => (
              <Space key={idx}>
                <PhoneOutlined style={{ color: '#52c41a' }} />
                <Link href={`tel:${phone}`} style={{ fontSize: '12px' }}>
                  {phone}
                </Link>
              </Space>
            ))}
          </Space>
        </div>
      )}

      {company.emails && company.emails.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {company.emails.map((email, idx) => (
              <Space key={idx}>
                <MailOutlined style={{ color: '#fa8c16' }} />
                <Link href={`mailto:${email}`} style={{ fontSize: '12px' }}>
                  {email}
                </Link>
              </Space>
            ))}
          </Space>
        </div>
      )}

      {company.website && (
        <div style={{ marginBottom: 8 }}>
          <Space>
            <GlobalOutlined style={{ color: '#1890ff' }} />
            <Link
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px' }}
              ellipsis
            >
              {company.website}
            </Link>
          </Space>
        </div>
      )}

      {company.social && company.social.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {company.social.map((link, idx) => (
              <Link
                key={idx}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11px' }}
              >
                🔗 {link.length > 30 ? `${link.substring(0, 30)}...` : link}
              </Link>
            ))}
          </Space>
        </div>
      )}
    </Card>
  );
}

export default CompanyCard;
