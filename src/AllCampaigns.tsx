import {
  useSuiClientQuery,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Container, Heading, Text, Button } from "@radix-ui/themes";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";
import { PACKAGE_ID, CROWD_WALRUS_OBJECT_ID } from "./config";
import { PaginatedEvents, SuiEvent } from "@mysten/sui/client";
import { UseQueryResult } from "@tanstack/react-query";

interface CampaignData {
  id: { id: string };
  admin_id: string;
  name: string;
  short_description: string;
  subdomain_name: string;
  created_at: string;
  validated: boolean;
  metadata: {
    fields: {
      contents: { fields: { key: string; value: string }; type: string }[];
    };
  };
}

export function AllCampaigns() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [validatingCampaign, setValidatingCampaign] = useState<string | null>(
    null,
  );

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

  // // Extract the registered_subdomains table ID dynamically from CrowdWalrus object
  // const registeredSubdomainsTableId =
  //   crowdWalrusData?.data?.content?.dataType === "moveObject"
  //     ? (crowdWalrusData.data.content.fields as any)?.registered_subdomains
  //         ?.fields?.id?.id
  //     : null;

  // Get list of validated campaign IDs
  const validatedCampaignIds =
    crowdWalrusData?.data?.content?.dataType === "moveObject"
      ? (crowdWalrusData.data.content.fields as any)
          ?.validated_campaigns_list || []
      : [];

  // Query all dynamic fields from the registered_subdomains table to get campaign IDs
  // const {
  //   data: dynamicFieldsData,
  //   isPending: isDynamicFieldsPending,
  //   error: dynamicFieldsError,
  // } = useSuiClientQuery(
  //   "getDynamicFields",
  //   {
  //     parentId: registeredSubdomainsTableId,
  //   },
  //   {
  //     enabled: !!registeredSubdomainsTableId,
  //   },
  // );

  // First, get the dynamic field objects to access their values (the actual campaign IDs)
  // const dynamicFieldIds =
  //   dynamicFieldsData?.data?.map((field: any) => field.objectId) || [];

  // const {
  //   data: dynamicFieldObjectsData,
  //   isPending: isDynamicFieldObjectsPending,
  //   error: dynamicFieldObjectsError,
  // } = useSuiClientQuery(
  //   "multiGetObjects",
  //   {
  //     ids: dynamicFieldIds,
  //     options: {
  //       showContent: true,
  //     },
  //   },
  //   {
  //     enabled: dynamicFieldIds.length > 0,
  //   },
  // );

  const eventsResult: UseQueryResult<PaginatedEvents, Error> =
    useSuiClientQuery(
      "queryEvents",
      // Query for CampaignCreated events in the crowd_walrus module
      {
        query: {
          MoveEventType: `${PACKAGE_ID}::crowd_walrus::CampaignCreated`,
        },
        limit: 100,
        order: "descending",
      },
    );
  const eventsResultData: SuiEvent[] = eventsResult.data?.data || [];
  const campaignsIds = eventsResultData.map(
    (data) => (data.parsedJson as any)?.campaign_id as string,
  );

  console.log("campaignsIds", campaignsIds);

  // Extract the actual campaign IDs from the dynamic field values
  // const campaignIds =
  //   dynamicFieldObjectsData
  //     ?.map((fieldObj: any) => {
  //       const fields = fieldObj.data?.content?.fields;
  //       // The campaign ID is stored in the 'value' field of each dynamic field
  //       return fields?.value;
  //     })
  //     .filter(Boolean) || [];

  // Fetch all campaign details
  const {
    data: campaignsData,
    isPending: isCampaignsPending,
    error: campaignsError,
  } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: campaignsIds,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: campaignsIds.length > 0,
    },
  );

  console.log("campaignsData", campaignsData);

  // Check if current account has ValidateCap
  const { data: userObjectsData, isPending: isUserObjectsPending } =
    useSuiClientQuery(
      "getOwnedObjects",
      {
        owner: account?.address || "",
        filter: {
          StructType: `${PACKAGE_ID}::crowd_walrus::ValidateCap`,
        },
        options: {
          showContent: true,
        },
      },
      {
        enabled: !!account?.address,
      },
    );
  console.log("userObjectsData", userObjectsData);
  // Find ValidateCap that matches our CrowdWalrus
  const validateCap = userObjectsData?.data?.find((obj) => {
    if (obj.data?.content?.dataType === "moveObject") {
      const fields = obj.data.content.fields as any;
      return fields.crowd_walrus_id === CROWD_WALRUS_OBJECT_ID;
    }
    return false;
  });

  const canValidate = !!validateCap;

  // Validation functions
  const handleValidateCampaign = (campaignObjectId: string) => {
    if (!validateCap || !account) return;

    setValidatingCampaign(campaignObjectId);

    const tx = new Transaction();

    tx.moveCall({
      package: PACKAGE_ID,
      module: "crowd_walrus",
      function: "validate_campaign",
      arguments: [
        tx.object(CROWD_WALRUS_OBJECT_ID),
        tx.object(validateCap.data?.objectId!),
        tx.object(campaignObjectId),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          setValidatingCampaign(null);
          // Optionally refresh data or show success message
        },
        onError: () => {
          setValidatingCampaign(null);
        },
      },
    );
  };

  const handleUnvalidateCampaign = (campaignObjectId: string) => {
    if (!validateCap || !account) return;

    setValidatingCampaign(campaignObjectId);

    const tx = new Transaction();

    tx.moveCall({
      package: PACKAGE_ID,
      module: "crowd_walrus",
      function: "unvalidate_campaign",
      arguments: [
        tx.object(CROWD_WALRUS_OBJECT_ID),
        tx.object(validateCap.data?.objectId!),
        tx.object(campaignObjectId),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          setValidatingCampaign(null);
          // Optionally refresh data or show success message
        },
        onError: () => {
          setValidatingCampaign(null);
        },
      },
    );
  };

  if (crowdWalrusError) {
    return (
      <Container my="2">
        <Heading mb="2">All Campaigns</Heading>
        <Text style={{ color: "red" }}>
          Error loading CrowdWalrus: {crowdWalrusError.message}
        </Text>
      </Container>
    );
  }

  // if (dynamicFieldsError) {
  //   return (
  //     <Container my="2">
  //       <Heading mb="2">All Campaigns</Heading>
  //       <Text style={{ color: "red" }}>
  //         Error loading dynamic fields: {dynamicFieldsError.message}
  //       </Text>
  //     </Container>
  //   );
  // }

  // if (dynamicFieldObjectsError) {
  //   return (
  //     <Container my="2">
  //       <Heading mb="2">All Campaigns</Heading>
  //       <Text style={{ color: "red" }}>
  //         Error loading dynamic field objects:{" "}
  //         {dynamicFieldObjectsError.message}
  //       </Text>
  //     </Container>
  //   );
  // }

  if (campaignsError) {
    return (
      <Container my="2">
        <Heading mb="2">All Campaigns</Heading>
        <Text style={{ color: "red" }}>
          Error loading campaign details: {campaignsError.message}
        </Text>
      </Container>
    );
  }

  if (
    isCrowdWalrusPending ||
    // isDynamicFieldsPending ||
    // isDynamicFieldObjectsPending ||
    isCampaignsPending ||
    isUserObjectsPending
  ) {
    return (
      <Container my="2">
        <Heading mb="2">All Campaigns</Heading>
        <Text>Loading...</Text>
      </Container>
    );
  }

  // Process campaign data - now we should have actual Campaign objects
  const campaigns =
    campaignsData
      ?.filter((obj) => obj.data?.content?.dataType === "moveObject")
      .map((obj) => {
        const fields = (obj.data?.content as any)?.fields as CampaignData;
        const isValidated = validatedCampaignIds.includes(obj.data?.objectId);
        return {
          objectId: obj.data?.objectId,
          id: fields.id,
          admin_id: fields.admin_id,
          name: fields.name,
          short_description: fields.short_description,
          metadata: fields.metadata.fields.contents.map(
            (content) => content.fields,
          ),
          subdomain_name: fields.subdomain_name,
          created_at: fields.created_at,
          validated: fields.validated,
          isValidated,
        };
      }) || [];

  return (
    <Container my="2">
      <Heading mb="2">All Campaigns ({campaigns.length} total)</Heading>

      {campaigns.length === 0 ? (
        <div>
          <Text>No campaigns found</Text>
          <br />
          <Text style={{ color: "gray", fontSize: "12px" }}>
            Create your first campaign using the form above
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
              <strong>Campaign Statistics</strong>
            </Text>
            <br />
            <Text>📊 Total Campaigns: {campaigns.length}</Text>
            <br />
            <Text>
              ✅ Validated Campaigns:{" "}
              {campaigns.filter((p) => p.isValidated).length}
            </Text>
            <br />
            <Text>
              ⏳ Pending Validation:{" "}
              {campaigns.filter((p) => !p.isValidated).length}
            </Text>
          </div>

          {campaigns.map((campaign, index) => (
            <div
              key={campaign.objectId}
              style={{
                border: campaign.isValidated
                  ? "2px solid green"
                  : "1px solid orange",
                padding: "15px",
                marginBottom: "15px",
                // backgroundColor: campaign.isValidated ? "#f0f8f0" : "#fff8f0",
              }}
            >
              <Text>
                <strong>Campaign #{index + 1}</strong>{" "}
                <span
                  style={{
                    marginLeft: "10px",
                    color: campaign.isValidated ? "green" : "orange",
                    fontSize: "12px",
                  }}
                >
                  [
                  {campaign.isValidated
                    ? "✓ VALIDATED"
                    : "⏳ PENDING VALIDATION"}
                  ]
                </span>
              </Text>
              <br />
              <Text>
                <strong>Name:</strong> {campaign.name}
              </Text>
              <br />
              <Text>
                <strong>Short Description:</strong> {campaign.short_description}
              </Text>
              <br />
              <Text>
                <strong>Metadata:</strong>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "8px",
                  }}
                >
                  <tbody>
                    {campaign.metadata.map((metadata) => (
                      <tr key={metadata.key}>
                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "4px",
                            fontWeight: "bold",
                            width: "40%",
                          }}
                        >
                          {metadata.key}
                        </td>
                        <td
                          style={{ border: "1px solid #ddd", padding: "4px" }}
                        >
                          {metadata.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Text>
              <br />
              <Text>
                <strong>Subdomain:</strong> {campaign.subdomain_name}
              </Text>
              <br />
              <Text>
                <strong>Object ID:</strong> {campaign.objectId}
              </Text>
              <br />
              <Text>
                <strong>Admin ID:</strong> {campaign.admin_id}
              </Text>
              <br />
              <Text>
                <strong>Created At (Epoch):</strong> {campaign.created_at}
              </Text>

              {/* Validation buttons - only show if user has ValidateCap */}
              {canValidate && (
                <div style={{ marginTop: "15px" }}>
                  {campaign.isValidated ? (
                    <Button
                      onClick={() =>
                        handleUnvalidateCampaign(campaign.objectId!)
                      }
                      disabled={validatingCampaign === campaign.objectId}
                      style={{
                        backgroundColor: "orange",
                        color: "white",
                        cursor:
                          validatingCampaign === campaign.objectId
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {validatingCampaign === campaign.objectId
                        ? "Unvalidating..."
                        : "Unvalidate Campaign"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleValidateCampaign(campaign.objectId!)}
                      disabled={validatingCampaign === campaign.objectId}
                      style={{
                        backgroundColor: "green",
                        color: "white",
                        cursor:
                          validatingCampaign === campaign.objectId
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {validatingCampaign === campaign.objectId
                        ? "Validating..."
                        : "Validate Campaign"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
