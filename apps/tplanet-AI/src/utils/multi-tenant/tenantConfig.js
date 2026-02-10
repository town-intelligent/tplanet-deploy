/**
 * Static tenant configuration for development.
 * In production, this is loaded from the backend API.
 */

export const TENANT_CONFIG = {
  default: {
    tenant_id: 'default',
    name: 'TPlanet',
    features: {
      ai_secretary: true,
      nft: true,
      sroi: true,
      translate: true,
    },
    theme: {
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      accent_color: '#f59e0b',
    },
  },

  'nantou-gov': {
    tenant_id: 'nantou-gov',
    name: '南投縣政府',
    features: {
      ai_secretary: true,
      nft: false,
      sroi: true,
      translate: true,
    },
    theme: {
      primary_color: '#16a34a',
      secondary_color: '#166534',
      accent_color: '#84cc16',
    },
  },

  'newtaipei-city': {
    tenant_id: 'newtaipei-city',
    name: '新北市政府',
    features: {
      ai_secretary: true,
      nft: true,
      sroi: true,
      translate: true,
    },
    theme: {
      primary_color: '#0891b2',
      secondary_color: '#0e7490',
      accent_color: '#06b6d4',
    },
  },

  'taichung-city': {
    tenant_id: 'taichung-city',
    name: '台中市政府',
    features: {
      ai_secretary: true,
      nft: false,
      sroi: true,
      translate: false,
    },
    theme: {
      primary_color: '#dc2626',
      secondary_color: '#b91c1c',
      accent_color: '#f97316',
    },
  },
};

export default TENANT_CONFIG;
