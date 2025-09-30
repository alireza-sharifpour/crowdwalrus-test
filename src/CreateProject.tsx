import { useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Container, Flex, Heading, Text, Button } from "@radix-ui/themes";
import {
  PACKAGE_ID,
  CROWD_WALRUS_OBJECT_ID,
  CLOCK_OBJECT_ID,
  SUINS_MANAGER_OBJECT_ID,
  SUINS_OBJECT_ID,
} from "./config";

type MetadataItem = { key: string; value: string };

export function CreateProject() {
  const account = useCurrentAccount();
  const {
    mutate: signAndExecute,
    isPending,
    isSuccess,
    error,
  } = useSignAndExecuteTransaction();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subdomainName, setSubdomainName] = useState("");
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [startData, setStartData] = useState<number>(0);
  const [endData, setEndData] = useState<number>(1000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !subdomainName) {
      alert("Please fill all fields");
      return;
    }

    const tx = new Transaction();

    tx.moveCall({
      package: PACKAGE_ID,
      module: "crowd_walrus",
      function: "create_campaign",
      arguments: [
        tx.object(CROWD_WALRUS_OBJECT_ID),
        tx.object(SUINS_MANAGER_OBJECT_ID),
        tx.object(SUINS_OBJECT_ID),
        tx.object(CLOCK_OBJECT_ID),
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(subdomainName),
        tx.pure.vector(
          "string",
          metadata.map((item) => item.key),
        ),
        tx.pure.vector(
          "string",
          metadata.map((item) => item.value),
        ),
        tx.pure.u64(startData),
        tx.pure.u64(endData),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setSubdomainName("");
          setMetadata([]);
        },
      },
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

          <div>
            <label>Metadata:</label>
            <br />
            <table
              style={{
                width: "100%",
                marginBottom: "10px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "4px" }}>Key</th>
                  <th style={{ textAlign: "left", padding: "4px" }}>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {metadata.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "4px" }}>
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) => {
                          const newMetadata = [...metadata];
                          newMetadata[idx].key = e.target.value;
                          setMetadata(newMetadata);
                        }}
                        style={{ width: "100%", padding: "4px" }}
                      />
                    </td>
                    <td style={{ padding: "4px" }}>
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => {
                          const newMetadata = [...metadata];
                          newMetadata[idx] = {
                            ...newMetadata[idx],
                            value: e.target.value,
                          };
                          setMetadata(newMetadata);
                        }}
                        style={{ width: "100%", padding: "4px" }}
                      />
                    </td>
                    <td style={{ padding: "4px" }}>
                      <Button
                        type="button"
                        color="red"
                        variant="soft"
                        onClick={() => {
                          const newMetadata = metadata.filter(
                            (_, i) => i !== idx,
                          );
                          setMetadata(newMetadata);
                        }}
                        style={{ padding: "2px 8px" }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              type="button"
              variant="soft"
              onClick={() => setMetadata([...metadata, { key: "", value: "" }])}
              style={{ marginTop: "4px" }}
            >
              Add Metadata
            </Button>
          </div>

          <div>
            <label>Start Data:</label>
            <br />
            <input
              type="number"
              value={startData}
              onChange={(e) => setStartData(Number(e.target.value))}
            />
          </div>
          <div>
            <label>End Data:</label>
            <br />
            <input
              type="number"
              value={endData}
              onChange={(e) => setEndData(Number(e.target.value))}
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
