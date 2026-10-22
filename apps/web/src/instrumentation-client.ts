import { z } from "zod";

// Zod probes `new Function` before compiling a fast parser; under the CSP
// (no 'unsafe-eval') the probe is refused and reported as a violation on
// every page. Parsing in the browser is small enough to run uncompiled.
z.config({ jitless: true });
