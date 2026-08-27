import React from 'react';

export const SEOHead: React.FC = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RangeCraft AU",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "AUD"
    },
    "featureList": "52-week promotional calendar, scan rebate margin simulator, ACCC compliance auditor, FMCG trade spend optimization"
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  );
};
