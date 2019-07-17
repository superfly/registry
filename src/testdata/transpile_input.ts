import { ThisIsErased } from "./erased_because_type_only.ts";
import { foo2 } from "./type_import.ts";
import { Bar } from "https://example.com/cross_domain_import.ts";
import * as baz from "https://deno.land/x/absolute_import.ts";

const bar: ThisIsErased = new Bar(foo2, baz);
