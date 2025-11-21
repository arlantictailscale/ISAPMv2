import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/dashboard/', '/my-profile/', '/my-registrations/', '/my-posters/', '/payment/'],
    },
    sitemap: 'https://www.isapm2026.org/sitemap.xml',
  }
}
