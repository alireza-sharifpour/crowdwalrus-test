import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Container, Heading, Text } from "@radix-ui/themes";

const CROWD_WALRUS_OBJECT_ID =
  "0x183386f2aa18f615294d69ea7e766dd76a3305400866e3c3025c30b07af2dd61";

interface ProjectData {
  id: { id: string };
  admin_id: string;
  name: string;
  description: string;
  subdomain_name: string;
  created_at: string;
}

export function AllProjects() {
  // Get CrowdWalrus object to check validation status
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

  // Extract the registered_subdomains table ID dynamically from CrowdWalrus object
  const registeredSubdomainsTableId =
    crowdWalrusData?.data?.content?.dataType === "moveObject"
      ? (crowdWalrusData.data.content.fields as any)?.registered_subdomains
          ?.fields?.id?.id
      : null;

  // Get list of validated project IDs
  const validatedProjectIds =
    crowdWalrusData?.data?.content?.dataType === "moveObject"
      ? (crowdWalrusData.data.content.fields as any)?.validated_projects_list ||
        []
      : [];

  // Query all dynamic fields from the registered_subdomains table to get project IDs
  const {
    data: dynamicFieldsData,
    isPending: isDynamicFieldsPending,
    error: dynamicFieldsError,
  } = useSuiClientQuery(
    "getDynamicFields",
    {
      parentId: registeredSubdomainsTableId,
    },
    {
      enabled: !!registeredSubdomainsTableId,
    },
  );

  // First, get the dynamic field objects to access their values (the actual project IDs)
  const dynamicFieldIds =
    dynamicFieldsData?.data?.map((field: any) => field.objectId) || [];

  const {
    data: dynamicFieldObjectsData,
    isPending: isDynamicFieldObjectsPending,
    error: dynamicFieldObjectsError,
  } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: dynamicFieldIds,
      options: {
        showContent: true,
      },
    },
    {
      enabled: dynamicFieldIds.length > 0,
    },
  );

  // Extract the actual project IDs from the dynamic field values
  const projectIds =
    dynamicFieldObjectsData
      ?.map((fieldObj: any) => {
        const fields = fieldObj.data?.content?.fields;
        // The project ID is stored in the 'value' field of each dynamic field
        return fields?.value;
      })
      .filter(Boolean) || [];

  // Fetch all project details
  const {
    data: projectsData,
    isPending: isProjectsPending,
    error: projectsError,
  } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: projectIds,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: projectIds.length > 0,
    },
  );

  if (crowdWalrusError) {
    return (
      <Container my="2">
        <Heading mb="2">All Projects</Heading>
        <Text style={{ color: "red" }}>
          Error loading CrowdWalrus: {crowdWalrusError.message}
        </Text>
      </Container>
    );
  }

  if (dynamicFieldsError) {
    return (
      <Container my="2">
        <Heading mb="2">All Projects</Heading>
        <Text style={{ color: "red" }}>
          Error loading dynamic fields: {dynamicFieldsError.message}
        </Text>
      </Container>
    );
  }

  if (dynamicFieldObjectsError) {
    return (
      <Container my="2">
        <Heading mb="2">All Projects</Heading>
        <Text style={{ color: "red" }}>
          Error loading dynamic field objects:{" "}
          {dynamicFieldObjectsError.message}
        </Text>
      </Container>
    );
  }

  if (projectsError) {
    return (
      <Container my="2">
        <Heading mb="2">All Projects</Heading>
        <Text style={{ color: "red" }}>
          Error loading project details: {projectsError.message}
        </Text>
      </Container>
    );
  }

  if (
    isCrowdWalrusPending ||
    isDynamicFieldsPending ||
    isDynamicFieldObjectsPending ||
    isProjectsPending
  ) {
    return (
      <Container my="2">
        <Heading mb="2">All Projects</Heading>
        <Text>Loading...</Text>
      </Container>
    );
  }

  // Process project data - now we should have actual Project objects
  const projects =
    projectsData
      ?.filter((obj) => obj.data?.content?.dataType === "moveObject")
      .map((obj) => {
        const fields = (obj.data?.content as any)?.fields as ProjectData;
        const isValidated = validatedProjectIds.includes(obj.data?.objectId);
        return {
          objectId: obj.data?.objectId,
          id: fields.id,
          admin_id: fields.admin_id,
          name: fields.name,
          description: fields.description,
          subdomain_name: fields.subdomain_name,
          created_at: fields.created_at,
          isValidated,
        };
      }) || [];

  return (
    <Container my="2">
      <Heading mb="2">All Projects ({projects.length} total)</Heading>

      {projects.length === 0 ? (
        <div>
          <Text>No projects found</Text>
          <br />
          <Text style={{ color: "gray", fontSize: "12px" }}>
            Create your first project using the form above
          </Text>
        </div>
      ) : (
        <div>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            <Text>
              <strong>Project Statistics</strong>
            </Text>
            <br />
            <Text>📊 Total Projects: {projects.length}</Text>
            <br />
            <Text>
              ✅ Validated Projects:{" "}
              {projects.filter((p) => p.isValidated).length}
            </Text>
            <br />
            <Text>
              ⏳ Pending Validation:{" "}
              {projects.filter((p) => !p.isValidated).length}
            </Text>
          </div>

          {projects.map((project, index) => (
            <div
              key={project.objectId}
              style={{
                border: project.isValidated
                  ? "2px solid green"
                  : "1px solid orange",
                padding: "15px",
                marginBottom: "15px",
                // backgroundColor: project.isValidated ? "#f0f8f0" : "#fff8f0",
              }}
            >
              <Text>
                <strong>Project #{index + 1}</strong>{" "}
                <span
                  style={{
                    marginLeft: "10px",
                    color: project.isValidated ? "green" : "orange",
                    fontSize: "12px",
                  }}
                >
                  [
                  {project.isValidated
                    ? "✓ VALIDATED"
                    : "⏳ PENDING VALIDATION"}
                  ]
                </span>
              </Text>
              <br />
              <Text>
                <strong>Name:</strong> {project.name}
              </Text>
              <br />
              <Text>
                <strong>Description:</strong> {project.description}
              </Text>
              <br />
              <Text>
                <strong>Subdomain:</strong> {project.subdomain_name}
              </Text>
              <br />
              <Text>
                <strong>Object ID:</strong> {project.objectId}
              </Text>
              <br />
              <Text>
                <strong>Admin ID:</strong> {project.admin_id}
              </Text>
              <br />
              <Text>
                <strong>Created At (Epoch):</strong> {project.created_at}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
