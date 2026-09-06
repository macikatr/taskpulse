import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Cron Job / Scheduled Maintenance Endpoint
 * 
 * Invoked by external cron schedulers (e.g. Google Cloud Scheduler, Vercel Cron, GitHub Actions)
 * or triggered manually for testing from the dashboard.
 * 
 * Topic: In-Depth Firestore Collection Groups, Timestamps vs ISO Strings, and Batched Writes.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Support flexible threshold for testing:
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
     * Tasks are stored in subcollections: /workspaces/{workspaceId}/tasks/{taskId}
     * A regular collection query only looks at root collections.
     * `collectionGroup('tasks')` searches across ALL 'tasks' subcollections across every workspace!
     */
    const snapshot = await adminDb
      .collectionGroup("tasks")
      .where("status", "==", "done")
      .get();

    // In-depth learning: Compare Firestore Timestamp / ISO string against cutoff
    const docsToDelete: FirebaseFirestore.DocumentReference[] = [];
    const inspectionList: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Handle both native Firestore Timestamp and fallback fields (updatedAt / completedAt)
      let docTimeMillis: number | null = null;
      if (data.completedAt instanceof Timestamp) {
        docTimeMillis = data.completedAt.toMillis();
      } else if (data.updatedAt instanceof Timestamp) {
        docTimeMillis = data.updatedAt.toMillis();
      } else if (typeof data.completedAt === "string") {
        // Parsing ISO string
        docTimeMillis = new Date(data.completedAt).getTime();
      }

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

    // ATOMIC BATCHED DELETE:
    // Instead of deleting documents sequentially, execute up to 500 deletions atomically
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
      scannedCompletedTasks: snapshot.size,
      deletedCount: docsToDelete.length,
      deletedTasks: inspectionList,
    });
  } catch (error: any) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
