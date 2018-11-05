/*!
   Copyright 2018 Propel http://propel.site/.  All rights reserved.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import { h } from "preact";
import { GlobalHeader } from "./header";
import { UserMenu } from "./menu";

// tslint:disable-next-line:variable-name
export const Home = props => {
  return (
    <div class="index">
        <div class="flex-row">
          <div class="flex-cell">
            <h2>Create Package</h2>
            <b>Package Name</b> <br/>
            No spaces. No unicode, use ascii.
               Use underscores instead of dash.
          </div>
        </div>
        <div class="flex-row">
          <div class="flex-cell">
            <input type="text" />
          </div>
        </div>

        <div class="flex-row">
          <div class="flex-cell">
            <b>Link to github repo</b>
          </div>
        </div>
        <div class="flex-row">
          <div class="flex-cell">
            <input type="text" />
            <br/>
            <button>Create</button>
          </div>
        </div>
    </div>
  );
};
