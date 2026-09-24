import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import raw from "../src/data/alerts.json";
import { DashboardContainer } from "../src/containers/DashboardContainer";
import { AlertStore } from "../src/core/AlertStore";
import { SeverityBadge } from "../src/components/SeverityBadge";
import { AlertTable } from "../src/components/AlertTable";

const loader = () => Promise.resolve(raw);

async function setup() {
  const store = new AlertStore();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(<DashboardContainer store={store} loader={loader} />);
  await screen.findByRole("table");
  return { store, user };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("presentational SeverityBadge renders purely from props", () => {
  render(<SeverityBadge severity="critical" />);
  expect(screen.getByText("critical")).toBeInTheDocument();
});

test("presentational AlertTable shows an empty state", () => {
  render(<AlertTable rows={[]} selectedIds={new Set()} onToggleRow={() => {}} onToggleAll={() => {}} onOpen={() => {}} />);
  expect(screen.getByText(/no alerts match/i)).toBeInTheDocument();
});

test("renders 15 rows per page and 600 open alerts", async () => {
  await setup();
  expect(screen.getAllByRole("row")).toHaveLength(16); // header + 15
  expect(screen.getByTestId("stat-Open alerts")).toHaveTextContent("600");
  expect(screen.getByText("Page 1 of 40")).toBeInTheDocument();
});

test("search is debounced: the table only filters after 250 ms", async () => {
  const { user } = await setup();
  const input = screen.getByRole("searchbox", { name: /search alerts/i });
  await user.type(input, "ALR-10001");
  expect(screen.getAllByRole("row").length).toBeGreaterThan(2); // not filtered yet
  act(() => jest.advanceTimersByTime(250));
  expect(screen.getAllByRole("row")).toHaveLength(2); // header + exact match
});

test("bulk resolve, then undo and redo with keyboard shortcuts", async () => {
  const { store, user } = await setup();
  const boxes = screen.getAllByRole("checkbox", { name: /select alr-/i });
  await user.click(boxes[0]);
  await user.click(boxes[1]);
  expect(screen.getByText("2 selected")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Resolve" }));

  expect(screen.getByTestId("stat-Open alerts")).toHaveTextContent("598");
  expect(screen.getByTestId("stat-Resolved")).toHaveTextContent("2");

  await user.keyboard("{Control>}z{/Control}");
  expect(screen.getByTestId("stat-Resolved")).toHaveTextContent("0");
  await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
  expect(screen.getByTestId("stat-Resolved")).toHaveTextContent("2");
  expect(store.history.canRedo).toBe(false);
});

test("opening a row lazy-loads the detail panel and triage updates the row", async () => {
  const { user } = await setup();
  const firstRow = screen.getAllByRole("row")[1];
  const id = within(firstRow).getAllByRole("cell")[1].textContent;
  await user.click(firstRow);
  const panel = await screen.findByRole("complementary", { name: `Details for ${id}` });
  await user.click(within(panel).getByRole("button", { name: "False positive" }));
  expect(screen.getByTestId("stat-False positives")).toHaveTextContent("1");
  await user.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.getByTestId("stat-False positives")).toHaveTextContent("0");
});

test("shows an error state with retry when the feed fails", async () => {
  let fail = true;
  const flakyLoader = () => (fail ? Promise.reject(new Error("HTTP 503")) : Promise.resolve(raw));
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(<DashboardContainer store={new AlertStore()} loader={flakyLoader} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("HTTP 503");
  fail = false;
  await user.click(screen.getByRole("button", { name: /try again/i }));
  expect(await screen.findByRole("table")).toBeInTheDocument();
});
