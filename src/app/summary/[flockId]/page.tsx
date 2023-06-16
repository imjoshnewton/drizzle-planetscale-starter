import { db } from "@/lib/db";
import { eggLog, expense, flock } from "@/lib/db/schema";
import { log } from "console";
import { addMonths, format, getDaysInMonth } from "date-fns";
import { and, between, eq, sql } from "drizzle-orm";
import FlockSummary from "./FlockSummary";

export const config = {
  runtime: "edge",
};

export default async function Summary({
  params,
  searchParams,
}: {
  params: { flockId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const flockId = params.flockId;
  const month = searchParams.month as string;
  const year = searchParams.year as string;

  async function getSummaryData({
    month,
    year,
    flockId,
  }: {
    month: string;
    year: string;
    flockId: string;
  }) {
    const startOfMonth = new Date(`${month}/01/${year}`);
    const startOfNextMonth = addMonths(startOfMonth, 1);

    console.log("Start of this month: ", startOfMonth);
    console.log("Start of next month: ", startOfNextMonth);

    const flockData = await db.query.flock.findFirst({
      where: eq(flock.id, flockId),
      with: {
        breeds: true,
      },
    });

    if (!flockData) {
      return null;
    }

    const expenseData = await db
      .select({
        category: expense.category,
        amountByCategory: sql<number>`sum(${expense.amount})`,
      })
      .from(expense)
      .where(
        and(
          eq(expense.flockId, flockId),
          between(
            expense.date,
            format(startOfMonth, "yyyy-MM-dd"),
            format(startOfNextMonth, "yyyy-MM-dd")
          )
        )
      )
      .groupBy(expense.category);

    const totalExpenses = expenseData
      .map((exp) => exp.amountByCategory ?? 0)
      .reduce((acc, cur) => acc + cur);

    const logs = await db
      .select()
      .from(eggLog)
      .where(
        and(
          eq(eggLog.flockId, flockId),
          between(
            eggLog.date,
            format(startOfMonth, "yyyy-MM-dd"),
            format(startOfNextMonth, "yyyy-MM-dd")
          )
        )
      )
      .as("logs");

    const [logStats] = await db
      .select({
        count: sql<number>`count(${eggLog.id})`,
        avg: sql<number>`avg(${eggLog.count})`,
        sum: sql<number>`sum(${eggLog.count})`,
        max: sql<number>`max(${eggLog.count})`,
      })
      .from(logs);

    return {
      flock: {
        id: flockData?.id,
        name: flockData?.name,
        image: flockData?.imageUrl,
      },
      expenses: {
        total: totalExpenses,
        categories: expenseData.map((exp) => {
          return {
            category: exp.category,
            amount: exp.amountByCategory ?? 0,
          };
        }),
      },
      logs: {
        total: logStats.sum ?? 0,
        numLogs: logStats.count ?? 0,
        average: logStats.avg ?? 0,
        calcAvg: (logStats.sum ?? 0) / getDaysInMonth(startOfMonth),
        largest: logStats.max ?? 0,
      },
      year: startOfMonth.toLocaleString("default", { year: "numeric" }),
      month: startOfMonth.toLocaleString("default", { month: "long" }),
    };
  }

  const summary = await getSummaryData({
    flockId: typeof flockId == "string" ? flockId : "",
    month: typeof month == "string" ? month : "",
    year: typeof year == "string" ? year : "",
  });

  log("Summary: ", summary);

  if (!summary) {
    return <div>Not found</div>;
  }

  return (
    <>
      <main className='flex flex-col items-center justify-center'>
        <FlockSummary summary={summary} />
      </main>
    </>
  );
}
