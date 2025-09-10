import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Container, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { PACKAGE_ID, CROWD_WALRUS_OBJECT_ID } from "./config";

export function CreateProject() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending, isSuccess, error } = useSignAndExecuteTransaction();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subdomainName, setSubdomainName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !subdomainName) {
      alert("Please fill all fields");
      return;
    }

    const tx = new Transaction();
    
    tx.moveCall({
      package: PACKAGE_ID,
      module: "manager",
      function: "create_project",
      arguments: [
        tx.object(CROWD_WALRUS_OBJECT_ID),
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(subdomainName),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setSubdomainName("");
        },
      }
    );
  };

  if (!account) {
    return (
      <Container my="2">
        <Text>Please connect your wallet to create a project</Text>
      </Container>
    );
  }

  return (
    <Container my="2">
      <Heading mb="2">Create Project</Heading>
      
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="2">
          <div>
            <label>Name:</label>
            <br />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "5px" }}
            />
          </div>
          
          <div>
            <label>Description:</label>
            <br />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "5px", minHeight: "60px" }}
            />
          </div>
          
          <div>
            <label>Subdomain Name:</label>
            <br />
            <input
              type="text"
              value={subdomainName}
              onChange={(e) => setSubdomainName(e.target.value)}
              style={{ width: "100%", padding: "5px" }}
            />
          </div>
          
          <Button
            type="submit"
            disabled={isPending}
            style={{ marginTop: "10px" }}
          >
            {isPending ? "Creating..." : "Create Project"}
          </Button>
        </Flex>
      </form>
      
      {isSuccess && (
        <Text style={{ color: "green", marginTop: "10px" }}>
          Project created successfully!
        </Text>
      )}
      
      {error && (
        <Text style={{ color: "red", marginTop: "10px" }}>
          Error: {error.message}
        </Text>
      )}
    </Container>
  );
}