// identity.circom

template IdentityClaim() {
    signal input claim;
    signal input hash;

    signal output valid;

    component mainHasher = Poseidon(2);

    mainHasher.inputs[0] <== claim;

    hash === mainHasher.out;

    valid <== 1;
}

component main = IdentityClaim();
