module.exports = {
  mssql: {
    development: {
      host: '202.67.10.67',
      port: 1433,
      user: 'market_dba',
      password : 'YhQH^j8W#!',
      database : 'OnePlus'
    },
    production: {
      host: '',
      port: '',
      user: '',
      password : ',',
      database : '',
    }
  },

  mongo: {
    development: {
      host: 'mongodb://staff:eannovate88@ds151007.mlab.com:51007/oneplus',
    },
    production: {
      host: 'localhost',
    }
  }
}
