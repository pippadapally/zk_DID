const snarkjs = require('snarkjs');
const fetch = require('node-fetch');
const { Keypair, PublicKey } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');
const { Program, Provider, web3 } = require('@project-serum/anchor');

const idl = JSON.parse(require('fs').readFileSync('../target/idl/identity_claims.json', 'utf8'));

const programID = new PublicKey('<Your Program ID>');
const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');
const wallet = new anchor.Wallet(Keypair.generate());
const provider = new Provider(connection, wallet, Provider.defaultOptions());

const program = new Program(idl, programID, provider);

async function generateProof(claimData) {
    const input = {
        claim: claimData,
        hash: 'computed_hash'  // Compute the hash based on your logic
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, '../circuits/identity_js/identity.wasm', '../circuits/identity_final.zkey');

    return {
        proofData: Buffer.from(JSON.stringify(proof)),
        publicInputs: Buffer.from(JSON.stringify(publicSignals))
    };
}

async function createClaim(claimData) {
    const claim = Keypair.generate();

    await program.rpc.createClaim(claimData, {
        accounts: {
            claim: claim.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
        },
        signers: [claim],
    });

    console.log('Claim created:', claim.publicKey.toBase58());
}

async function verifyClaim(claimPublicKey, claimData) {
    const proof = await generateProof(claimData);
    const claimKey = new PublicKey(claimPublicKey);

    try {
        await program.rpc.verifyClaim(proof, {
            accounts: {
                claim: claimKey,
            },
        });
        console.log('Claim verified successfully');
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

// Example usage:
createClaim('some_claim_data');
verifyClaim('<Claim Public Key>', 'some_claim_data');
