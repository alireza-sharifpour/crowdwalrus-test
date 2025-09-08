import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Container, Heading, Text } from "@radix-ui/themes";

const CROWD_WALRUS_OBJECT_ID =
  "0x183386f2aa18f615294d69ea7e766dd76a3305400866e3c3025c30b07af2dd61";

export function AllProjects() {
  // Get CrowdWalrus object to check validation status and registered projects count
  const {
    data: crowdWalrusData,
    isPending: isCrowdWalrusPending,
    error: crowdWalrusError,
  } = useSuiClientQuery("getObject", {
    id: CROWD_WALRUS_OBJECT_ID,
    options: {
      showContent: true,
    },
  });

  // Get list of validated project IDs
  const validatedProjectIds =
    crowdWalrusData?.data?.content?.dataType === "moveObject"
      ? (crowdWalrusData.data.content.fields as any)?.validated_projects_list ||
        []
      : [];

  // Get count of registered projects from the table
  const registeredCount =
    crowdWalrusData?.data?.content?.dataType === "moveObject"
      ? parseInt(
          (crowdWalrusData.data.content.fields as any)?.registered_subdomains
            ?.fields?.size || "0",
        )
      : 0;

  if (crowdWalrusError) {
    return (
      <Container my="2">
        <Heading mb="2">All Projects</Heading>
        <Text style={{ color: "red" }}>
          Error loading CrowdWalrus: {crowdWalrusError.message}
        </Text>
        <br />
        <Text style={{ color: "gray", fontSize: "12px" }}>
          Make sure the CrowdWalrus object ID is correct:{" "}
          {CROWD_WALRUS_OBJECT_ID}
        </Text>
      </Container>
    );
  }

  if (isCrowdWalrusPending) {
    return (
      <Container my="2">
        <Heading mb="2">All Projects</Heading>
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container my="2">
      <Heading mb="2">All Projects</Heading>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          marginBottom: "15px",
          // backgroundColor: "#f9f9f9",
        }}
      >
        <Text>
          <strong>Project Statistics</strong>
        </Text>
        <br />
        <Text>📊 Total Registered Projects: {registeredCount}</Text>
        <br />
        <Text>✅ Validated Projects: {validatedProjectIds.length}</Text>
        <br />
        <Text>
          ⏳ Pending Validation: {registeredCount - validatedProjectIds.length}
        </Text>
      </div>

      {registeredCount === 0 ? (
        <div>
          <Text>No projects found</Text>
          <br />
          <Text style={{ color: "gray", fontSize: "12px" }}>
            Create your first project using the form above
          </Text>
        </div>
      ) : (
        <div>
          <Text
            style={{ color: "orange", fontSize: "14px", marginBottom: "10px" }}
          >
            ⚠️ Note: Individual project details require querying the blockchain
            by project ID. The registered projects table contains{" "}
            {registeredCount} project(s), but we can only show validated
            projects directly from the validated_projects_list.
          </Text>

          {validatedProjectIds.length > 0 && (
            <div>
              <Text>
                <strong>Validated Project IDs:</strong>
              </Text>
              {validatedProjectIds.map((id: string, index: number) => (
                <div
                  key={id}
                  style={{
                    border: "2px solid green",
                    padding: "10px",
                    marginTop: "10px",
                    // backgroundColor: "#f0f8f0"
                  }}
                >
                  <Text>
                    <strong>Validated Project #{index + 1}</strong> ✅
                  </Text>
                  <br />
                  <Text>
                    <strong>Object ID:</strong> {id}
                  </Text>
                  <br />
                  <Text style={{ color: "gray", fontSize: "12px" }}>
                    To see full project details, query this object ID directly
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
