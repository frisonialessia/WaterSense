// Server Component: reads farm data from the repository (the swap seam),
// runs the pump-health brain server-side, and hands the result to the
// client dashboard shell.
import { repository } from "@/lib/data/repository";
import { assessPump } from "@/lib/brain/pumpHealth";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage() {
  const [costs, parcels, wells, regions, crops, tariffCurve, forecast, actions, savings, trends, aquifer] = await Promise.all([
    repository.getCosts(),
    repository.getParcels(),
    repository.getWells(),
    repository.getRegions(),
    repository.getCrops(),
    repository.getTariffCurve(),
    repository.getForecast(),
    repository.getScheduledActions(),
    repository.getSavings(),
    repository.getKpiTrends(),
    repository.getAquiferNeighborhood(),
  ]);
  const pumps = wells.map((w) => assessPump(w, w.ok ? 0 : 18));

  return <Dashboard data={{ costs, parcels, wells, pumps, regions, crops, tariffCurve, forecast, actions, savings, trends, aquifer }} />;
}
