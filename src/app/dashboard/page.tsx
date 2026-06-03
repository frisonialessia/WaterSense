// Server Component: reads farm data from the repository (the swap seam),
// runs the pump-health brain server-side, and hands the result to the
// client dashboard shell.
import { repository } from "@/lib/data/SimulatedRepository";
import { assessPump } from "@/lib/brain/pumpHealth";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage() {
  const [costs, parcels, wells] = await Promise.all([
    repository.getCosts(),
    repository.getParcels(),
    repository.getWells(),
  ]);
  const pumps = wells.map((w) => assessPump(w, w.ok ? 0 : 18));

  return <Dashboard data={{ costs, parcels, wells, pumps }} />;
}
