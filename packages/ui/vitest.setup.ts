import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sans globales Vitest, Testing Library ne démonte pas seul les rendus entre deux tests.
afterEach(cleanup);
