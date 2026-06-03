// Server Component: reads farm data from the repository (the swap seam)
// and hands it to the client dashboard shell. The brain still runs
// server-side as views are migrated on top of it.
import { repository } from "@/lib/data/SimulatedRepository";
import { Dashboard } from "@/components/Dashboard";

export default async function Home() {
  const costs = await repository.getCosts();

  return <Dashboard data={{ costs }} />;
}
