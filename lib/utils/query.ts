import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client"; // Import your initialized Firestore db instance

export async function getMostRecentDocument(collectionName: string, sortwith: string) {
  // 1. Create a reference to your collection
  const colRef = collection(db, collectionName);

  // 2. Build a query with orderBy and limit
  const q = query(colRef, orderBy(sortwith, "desc"), limit(1));

  // 3. Execute the query
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  // 4. Extract data and ID
  const latestDoc = snapshot.docs[0];
  return {
    id: latestDoc.id,
    ...latestDoc.data(),
  };
}


interface GetLatestWorkspaceProps {
  currentUserId: string;
}

export async function getLatestWorkspaceForUser({ currentUserId }: GetLatestWorkspaceProps) {
  try {
    const workspacesRef = collection(db, "workspaces");

    // Query for workspaces where the user is listed in the memberIds array
    const latestQuery = query(
      workspacesRef,
      where("memberIds", "array-contains", currentUserId),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(latestQuery);

    if (querySnapshot.empty) {
      return null;
    }

    const latestDoc = querySnapshot.docs[0];
    
    // Return data structured to match your WorkspaceSchema
    return {
      id: latestDoc.id,
      ...latestDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching latest workspace:", error);
    throw error;
  }
}

