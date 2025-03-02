use anchor_lang::prelude::*;
use serde::{Deserialize, Serialize};
use reqwest;

declare_id!("Fg6PaFpoGXkYsidMpWFKK92B5sbswN5bGiZ9ngfpZfrg");

#[program]
pub mod identity_claims {
    use super::*;
    pub fn create_claim(ctx: Context<CreateClaim>, claim_data: String) -> ProgramResult {
        let claim = &mut ctx.accounts.claim;
        claim.owner = *ctx.accounts.user.key;
        claim.claim_data = claim_data;
        Ok(())
    }

    pub fn verify_claim(ctx: Context<VerifyClaim>, proof: ZKProof) -> ProgramResult {
        let claim = &ctx.accounts.claim;

        // Deserialize proof and public inputs
        let proof = serde_json::from_slice::<Proof>(&proof.proof_data).unwrap();
        let public_inputs = serde_json::from_slice::<Vec<String>>(&proof.public_inputs).unwrap();

        // Implement ZKP verification logic here using an off-chain verifier
        if off_chain_verify(proof, public_inputs).unwrap() {
            Ok(())
        } else {
            Err(ErrorCode::InvalidProof.into())
        }
    }
}

#[derive(Accounts)]
pub struct CreateClaim<'info> {
    #[account(init, payer = user, space = 8 + 64)]
    pub claim: Account<'info, Claim>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyClaim<'info> {
    pub claim: Account<'info, Claim>,
}

#[account]
pub struct Claim {
    pub owner: Pubkey,
    pub claim_data: String,
}

#[error]
pub enum ErrorCode {
    #[msg("Invalid proof provided")]
    InvalidProof,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ZKProof {
    pub proof_data: Vec<u8>,
    pub public_inputs: Vec<u8>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Proof {
    pub pi_a: Vec<String>,
    pub pi_b: Vec<Vec<String>>,
    pub pi_c: Vec<String>,
    pub protocol: String,
    pub curve: String,
}

async fn off_chain_verify(proof: Proof, public_inputs: Vec<String>) -> Result<bool, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client.post("http://localhost:3000/verify")
        .json(&serde_json::json!({
            "proof": proof,
            "publicSignals": public_inputs,
        }))
        .send()
        .await?;

    let result: serde_json::Value = response.json().await?;
    Ok(result["valid"].as_bool().unwrap_or(false))
}
