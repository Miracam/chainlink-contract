const { ethers } = require("hardhat");


async function main() {
  // Get the contract instance
  const contractAddress = "0x3251e88F2579b20CCB996066E457967683AFd91D"; // Replace with your deployed contract address
  const FunctionsConsumer = await ethers.getContractFactory("FunctionsConsumer");
  const consumer = FunctionsConsumer.attach(contractAddress);

  // Address to query
  const addressToQuery = "0x80a301ba2fb59c9a0e90616110bb39726643e1ce"; // Replace with the address you want to query

  try {
    // Query the attesterOf mapping
    const attester = await consumer.attesterOf(addressToQuery);
    console.log(`Attester for address ${addressToQuery}:`);
    console.log(attester);
  } catch (error) {
    console.error("Error querying attester:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });