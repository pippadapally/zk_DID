// migrations/deploy.js
const anchor = require('@project-serum/anchor');

module.exports = async function (provider) {
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  // Add your deploy script here.
  const program = anchor.workspace.IdentityClaims;

  const tx = await program.rpc.initialize();
  console.log("Your transaction signature", tx);
};
