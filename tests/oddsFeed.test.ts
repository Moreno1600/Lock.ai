import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePayload,
  matchSportsbookEvent,
  summarizeSportsbookMarket,
  type OddsFeed
} from "../oddsFeed.js";

const kickoff = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const updated = new Date().toISOString();
const sample = {
  success: true,
  data: [{
    event_id: "example-nba",
    home_team: "Los Angeles Lakers",
    away_team: "Boston Celtics",
    start_time: kickoff,
    books: [
      {
        book: "draftkings", market: "h2h", updated_at: updated,
        outcomes: [{ name: "Lakers", price: -120 }, { name: "Celtics", price: 110 }]
      },
      {
        book: "draftkings", market: "totals", updated_at: updated,
        outcomes: [{ name: "Over", point: 224.5, price: -110 }, { name: "Under", point: 224.5, price: -110 }]
      },
      {
        book: "fanduel", market: "spreads", updated_at: updated,
        outcomes: [{ name: "Lakers", point: -3.5, price: -110 }, { name: "Celtics", point: 3.5, price: -110 }]
      }
    ]
  }]
};
const feed = (): OddsFeed => ({
  status: "connected", message: "", fetchedAt: updated,
  events: normalizePayload(sample)
});

test("normalizes the provider's event/market/books response format", () => {
  const events = normalizePayload(sample);
  assert.equal(events.length, 1);
  assert.equal(events[0].id, "example-nba");
  assert.equal(events[0].markets.length, 3);
  assert.equal(events[0].markets[0].book, "draftkings");
});
test("matches real ESPN full team names to shortened bookmaker outcomes", () => {
  const event = matchSportsbookEvent(feed(), "Boston Celtics", "Los Angeles Lakers", kickoff);
  assert.ok(event);
  const result = summarizeSportsbookMarket(event);
  assert.equal(result.moneyline?.awayPrice, 110);
  assert.equal(result.moneyline?.homePrice, -120);
  assert.equal(result.moneyline?.book, "draftkings");
  assert.ok(Math.abs((result.moneyline?.noVigAway || 0) + (result.moneyline?.noVigHome || 0) - 100) <= 0.11);
  assert.equal(result.total?.line, 224.5);
  assert.equal(result.total?.noVigOver, 50);
  assert.equal(result.spread?.homePoint, -3.5);
  assert.equal(result.spread?.awayPoint, 3.5);
});
test("does not match a different fixture or far-away kickoff", () => {
  assert.equal(matchSportsbookEvent(feed(), "Boston Celtics", "New York Knicks", kickoff), null);
  const later = new Date(Date.parse(kickoff) + 24 * 60 * 60 * 1000).toISOString();
  assert.equal(matchSportsbookEvent(feed(), "Boston Celtics", "Los Angeles Lakers", later), null);
});
test("does not crash or invent paired odds when a book omits a team", () => {
  const rows = normalizePayload({
    data: [{ ...sample.data[0], books: [{
      book: "fanduel", market: "spreads", updated_at: updated,
      outcomes: [{ name: "Celtics", point: 3.5, price: -110 }]
    }] }]
  });
  const summary = summarizeSportsbookMarket(rows[0]);
  assert.equal(summary.spread, null);
  assert.equal(summary.moneyline, null);
});
test("rejects unpriced outcomes rather than manufacturing moneylines", () => {
  const rows = normalizePayload({
    data: [{ ...sample.data[0], books: [{
      book: "draftkings", market: "h2h", updated_at: updated,
      outcomes: [{ name: "Lakers" }, { name: "Celtics", price: 105 }]
    }] }]
  });
  assert.equal(rows.length, 1);
  assert.equal(summarizeSportsbookMarket(rows[0]).moneyline, null);
});
