import React, { useMemo, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, Typography, Tag, Space } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, GlobalOutlined } from '@ant-design/icons';

const { Text, Link } = Typography;

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 36.8065, // Tunisie center
  lng: 10.1815,
};

const mapOptions = {
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#242f3e' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#2c4458' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#2c4458' }],
    },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

function CompanyMap({ companies, apiKey }) {
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Debug logging
  React.useEffect(() => {
    console.log('CompanyMap rendered:', {
      companiesCount: companies?.length || 0,
      apiKey: !!apiKey,
      validCompanies: companies?.filter(c => c.lat && c.lng).length || 0,
    });
  }, [companies, apiKey]);

  const bounds = useMemo(() => {
    if (!companies || companies.length === 0) return null;
    
    const validCompanies = companies.filter(c => c.lat && c.lng);
    if (validCompanies.length === 0) return null;

    const lats = validCompanies.map(c => c.lat);
    const lngs = validCompanies.map(c => c.lng);
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }, [companies]);

  const center = useMemo(() => {
    if (bounds) {
      return {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2,
      };
    }
    return defaultCenter;
  }, [bounds]);

  const validCompanies = useMemo(() => {
    const valid = companies?.filter(c => c.lat && c.lng) || [];
    console.log('CompanyMap - validCompanies:', valid.length);
    return valid;
  }, [companies]);

  if (!apiKey) {
    console.warn('CompanyMap - No API key');
    return (
      <Card>
        <Text type="secondary">Clé Google Maps non configurée</Text>
      </Card>
    );
  }

  if (validCompanies.length === 0) {
    console.warn('CompanyMap - No valid companies with coordinates');
    return (
      <Card>
        <Text type="secondary">Aucune entreprise avec coordonnées</Text>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <EnvironmentOutlined />
          <span>Carte des Entreprises ({validCompanies.length})</span>
        </Space>
      }
      style={{ 
        marginTop: 0,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        background: '#1f1f1f',
        border: '1px solid #434343'
      }}
    >
      <LoadScript 
        googleMapsApiKey={apiKey} 
        loadingElement={<div>Chargement de la carte...</div>}
        key={`map-${companies?.length || 0}-${validCompanies.length}`}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={bounds ? 10 : 7}
          options={mapOptions}
          onLoad={(map) => {
            if (bounds && validCompanies.length > 0) {
              const googleBounds = new window.google.maps.LatLngBounds();
              validCompanies.forEach(company => {
                googleBounds.extend({ lat: company.lat, lng: company.lng });
              });
              map.fitBounds(googleBounds);
              // Add padding to bounds
              const padding = 50;
              map.fitBounds(googleBounds, padding);
            }
          }}
        >
          {validCompanies.map((company, index) => (
            <Marker
              key={`${company.name}-${index}`}
              position={{ lat: company.lat, lng: company.lng }}
              onClick={() => setSelectedCompany(company)}
              title={company.name}
            />
          ))}

          {selectedCompany && (
            <InfoWindow
              position={{ lat: selectedCompany.lat, lng: selectedCompany.lng }}
              onCloseClick={() => setSelectedCompany(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -10),
              }}
            >
              <div 
                style={{ 
                  maxWidth: 300,
                  color: '#ffffff',
                  backgroundColor: '#1f1f1f',
                  padding: '12px',
                  borderRadius: '8px',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: 8,
                  color: '#ffffff',
                  borderBottom: '1px solid #434343',
                  paddingBottom: 8,
                }}>
                  {selectedCompany.name}
                </div>
                {selectedCompany.address && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                      <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                      {selectedCompany.address}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedCompany.city && (
                        <span style={{
                          backgroundColor: '#1890ff',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}>
                          {selectedCompany.city}
                        </span>
                      )}
                      {selectedCompany.country && (
                        <span style={{
                          backgroundColor: '#722ed1',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}>
                          {selectedCompany.country}
                        </span>
                      )}
                    </div>
                    {selectedCompany.phones && selectedCompany.phones.length > 0 && (
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
                        <PhoneOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                        <a 
                          href={`tel:${selectedCompany.phones[0]}`}
                          style={{ color: '#52c41a', textDecoration: 'none' }}
                        >
                          {selectedCompany.phones[0]}
                        </a>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div style={{ fontSize: '12px' }}>
                        <GlobalOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                        <a
                          href={selectedCompany.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#1890ff', 
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                          }}
                        >
                          {selectedCompany.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </Card>
  );
}

export default CompanyMap;

