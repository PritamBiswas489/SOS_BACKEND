export default {
  apps: [{
    name: "sos-app",
    script: "./www.js",
    node_args: "--import ./instrument.js",
    env: {
      NODE_ENV: "production",
    }
  }]
}