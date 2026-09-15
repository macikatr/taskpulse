import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Cron Job / Scheduled Maintenance Endpoint
 * 
 * Invoked by external cron schedulers or triggered manually from the dashboard.
 * 
 * Deep Dive: Firestore Collection Groups, Indexing Requirements, and Batch Operations.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Flexible threshold support:
    // e.g. /api/cron/cleanup-tasks?minutes=5 OR /api/cron/cleanup-tasks?days=7
    const daysParam = searchParams.get("days");
    const minutesParam = searchParams.get("minutes");

    let cutoffMillis: number;
    let thresholdDescription: string;

    if (minutesParam !== null) {
      const minutes = Math.max(0, parseInt(minutesParam, 10) || 0);
      cutoffMillis = Date.now() - minutes * 60 * 1000;
      thresholdDescription = `${minutes} minute(s)`;
    } else {
      const days = parseInt(daysParam || "7", 10);
      cutoffMillis = Date.now() - days * 24 * 60 * 60 * 1000;
      thresholdDescription = `${days} day(s)`;
    }

    const cutoffDate = new Date(cutoffMillis);
    const cutoffISOString = cutoffDate.toISOString();

    /**
     * FIRESTORE COLLECTION GROUP QUERY:
     * 
     * In Firestore, querying subcollections with .where() across all documents
     * (collectionGroup) requires a Collection Group Index scope on the field.
     * 
     * We attempt the indexed query first. If the index is still building or not yet
     * enabled, we gracefully fall back to querying all tasks and filtering in memory.
     */
    let completedDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    let usedIndex = true;
    let indexSetupUrl: string | null = null;

    try {
      const snapshot = await adminDb
        .collectionGroup("tasks")
        .where("status", "==", "done")
        .get();
      completedDocs = snapshot.docs;
    } catch (err) {
      // 1. Verify err is a valid object so we can read its properties safely
      if (err && typeof err === "object") {
        const errorObj = err as Record<string, unknown>;
        const errorCode = errorObj.code;
        const errorMessage = typeof errorObj.message === "string" ? errorObj.message : "";

        // 2. Perform conditional checks safely using the typed variables
        if (errorCode === 9 || errorMessage.includes("FAILED_PRECONDITION")) {
          usedIndex = false;

          // Extract the index creation URL provided by Firestore if present
          const match = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
          if (match) {
            indexSetupUrl = match[0];
          }

          // Graceful fallback: scan collection group and filter in memory
          const allTasksSnapshot = await adminDb.collectionGroup("tasks").get();
          completedDocs = allTasksSnapshot.docs.filter(
            (doc) => doc.data().status === "done"
          );
          
          return; // Or whatever control flow you need here to stop execution
        }
      }

      // 3. Re-throw the original error if it wasn't the missing index error
      throw err;
    }

    // Compare completedAt / updatedAt against the cutoff timestamp
    const docsToDelete: FirebaseFirestore.DocumentReference[] = [];
    type InspectionEntry = { id: string; title: string; completedAt: string; path: string };
    const inspectionList: InspectionEntry[] = [];

    for (const doc of completedDocs) {
      const data = doc.data();
      
      let docTimeMillis: number | null = null;
      if (data.completedAt instanceof Timestamp) {
        docTimeMillis = data.completedAt.toMillis();
      } else if (data.updatedAt instanceof Timestamp) {
        docTimeMillis = data.updatedAt.toMillis();
      } else if (typeof data.completedAt === "string") {
        docTimeMillis = new Date(data.completedAt).getTime();
      } else if (typeof data.updatedAt === "string") {
        docTimeMillis = new Date(data.updatedAt).getTime();
      }

      // If document was completed on or before the cutoff time, mark for deletion
      if (docTimeMillis !== null && docTimeMillis <= cutoffMillis) {
        docsToDelete.push(doc.ref);
        inspectionList.push({
          id: doc.id,
          title: data.title,
          completedAt: new Date(docTimeMillis).toISOString(),
          path: doc.ref.path,
        });
      }
    }

    // Atomic batched deletion
    if (docsToDelete.length > 0) {
      const batch = adminDb.batch();
      docsToDelete.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      cutoff: {
        threshold: thresholdDescription,
        isoString: cutoffISOString,
        epochMillis: cutoffMillis,
      },
      scannedCompletedTasks: completedDocs.length,
      deletedCount: docsToDelete.length,
      deletedTasks: inspectionList,
      indexStatus: usedIndex
        ? "Active (Indexed query)"
        : "Fallback scan used (Index creation recommended for production)",
      indexSetupUrl,
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
