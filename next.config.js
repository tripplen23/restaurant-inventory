const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // libSQL (@libsql/client) is pure-JS — no native bindings, no externals needed
};

module.exports = withNextIntl(nextConfig);
