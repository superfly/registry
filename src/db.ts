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

// This file contains routines for accessing the firebase database (firestore).
// This is used to save and restore packages.
// These routines are run only on the browser.
import { Package, PackageInfo, UserInfo } from "./types";
import { assert } from "./util";

// tslint:disable:no-reference
/// <reference path="firebase.d.ts" />

export interface Database {
  getPackage(pkgId: string): Promise<Package>;
  updatePackage(pkgId: string, pkg: Package): Promise<void>;
  create(name: string, url: string): Promise<string>;
  queryLatest(): Promise<PackageInfo[]>;
  signIn(): void;
  signOut(): void;
  subscribeAuthChange(cb: (user: UserInfo) => void): UnsubscribeCb;
}

export interface UnsubscribeCb {
  (): void;
}

// These are shared by all functions and are lazily constructed by lazyInit.
let db: firebase.firestore.Firestore;
let pkgCollection: firebase.firestore.CollectionReference;
let auth: firebase.auth.Auth;
const firebaseConfig = {
  apiKey: "AIzaSyAc5XVKd27iXdGf1ZEFLWudZbpFg3nAwjQ",
  authDomain: "propel-ml.firebaseapp.com",
  databaseURL: "https://propel-ml.firebaseio.com",
  messagingSenderId: "587486455356",
  projectId: "propel-ml",
  storageBucket: "propel-ml.appspot.com"
};

class DatabaseFB implements Database {
  async getPackage(pkgId: string): Promise<Package> {
    // We have one special doc that is loaded from memory, used for testing and
    // debugging.
    if (pkgId === "default") {
      return defaultPackage;
    }
    const docRef = pkgCollection.doc(pkgId);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as Package;
    } else {
      throw Error(`Package does not exist ${pkgId}`);
    }
  }

  // Caller must catch errors.
  async updatePackage(pkgId: string, doc: Package): Promise<void> {
    if (pkgId === "default") return; // Don't save the default doc.
    if (!ownsPackage(auth.currentUser, doc)) return;
    const docRef = pkgCollection.doc(pkgId);
    await docRef.update({
      name: doc.name || "",
      updated: firebase.firestore.FieldValue.serverTimestamp(),
      url: doc.url || ""
    });
  }

  async create(name: string, url: string): Promise<string> {
    lazyInit();
    const u = auth.currentUser;
    if (!u) return "anonymous";

    const newDoc = {
      created: firebase.firestore.FieldValue.serverTimestamp(),
      owner: {
        displayName: u.displayName,
        photoURL: u.photoURL,
        uid: u.uid
      },
      name,
      updated: firebase.firestore.FieldValue.serverTimestamp(),
      url
    };
    console.log({ newDoc });
    const docRef = await pkgCollection.add(newDoc);
    return docRef.id;
  }

  async queryLatest(): Promise<PackageInfo[]> {
    lazyInit();
    const query = pkgCollection.orderBy("updated", "desc").limit(100);
    const snapshots = await query.get();
    const out = [];
    snapshots.forEach(snap => {
      const pkgId = snap.id;
      const pkg = snap.data();
      out.unshift({ pkgId, pkg });
    });
    return out.reverse();
  }

  async queryProfile(uid: string, limit: number): Promise<PackageInfo[]> {
    lazyInit();
    const query = pkgCollection
      .orderBy("updated", "desc")
      .where("owner.uid", "==", uid)
      .limit(limit);
    const snapshots = await query.get();
    const out = [];
    snapshots.forEach(snap => {
      const pkgId = snap.id;
      const pkg = snap.data();
      out.unshift({ pkgId, pkg });
    });
    return out.reverse();
  }

  signIn() {
    lazyInit();
    const provider = new firebase.auth.GithubAuthProvider();
    auth.signInWithPopup(provider);
  }

  signOut() {
    lazyInit();
    auth.signOut();
  }

  subscribeAuthChange(cb: (user: UserInfo) => void): UnsubscribeCb {
    lazyInit();
    return auth.onAuthStateChanged(cb);
  }
}

export class DatabaseMock implements Database {
  private currentUser: UserInfo = null;
  private docs: { [key: string]: Package };
  counts = {};
  inc(method) {
    if (method in this.counts) {
      this.counts[method] += 1;
    } else {
      this.counts[method] = 1;
    }
  }

  constructor() {
    assert(defaultPackage != null);
    this.docs = { default: Object.assign({}, defaultPackage) };
  }

  async getPackage(pkgId: string): Promise<Package> {
    this.inc("getPackage");
    if (this.docs[pkgId] === null) {
      throw Error("getPackage called with bad pkgId " + pkgId);
    }
    return this.docs[pkgId];
  }

  async updatePackage(pkgId: string, pkg: Package): Promise<void> {
    this.inc("updatePackage");
    this.docs[pkgId] = Object.assign(this.docs[pkgId], pkg);
  }

  async create(name: string, url: string): Promise<string> {
    this.inc("create");
    return "createdPrId";
  }

  async queryProfile(uid: string, limit: number): Promise<PackageInfo[]> {
    this.inc("queryProfile");
    if (uid === defaultOwner.uid && limit > 0) {
      return [{ pkgId: "default", pkg: defaultPackage }];
    } else {
      return [];
    }
  }

  async queryLatest(): Promise<PackageInfo[]> {
    this.inc("queryLatest");
    return [];
  }

  signIn(): void {
    this.inc("signIn");
    this.currentUser = defaultOwner;
    this.makeAuthChangeCallbacks();
  }

  signOut(): void {
    this.inc("signOut");
    this.currentUser = null;
    this.makeAuthChangeCallbacks();
  }

  private authChangeCallbacks = [];
  private makeAuthChangeCallbacks() {
    for (const cb of this.authChangeCallbacks) {
      cb(this.currentUser);
    }
  }

  subscribeAuthChange(cb: (user: UserInfo) => void): UnsubscribeCb {
    this.inc("subscribeAuthChange");
    this.authChangeCallbacks.push(cb);
    return () => {
      const i = this.authChangeCallbacks.indexOf(cb);
      this.authChangeCallbacks.splice(i, 1);
    };
  }
}

export let active: Database = null;

export function enableFirebase() {
  active = new DatabaseFB();
}

export function enableMock(): DatabaseMock {
  const d = new DatabaseMock();
  active = d;
  return d;
}

export function ownsPackage(userInfo: UserInfo, pkg: Package): boolean {
  return userInfo && userInfo.uid === pkg.owner.uid;
}

function lazyInit() {
  if (db == null) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    // firebase.firestore.setLogLevel("debug");
    auth = firebase.auth();
    pkgCollection = db.collection("packages");
  }
  return true;
}

export const defaultOwner: UserInfo = Object.freeze({
  displayName: "default owner",
  photoURL: "https://avatars1.githubusercontent.com/u/80?v=4",
  uid: "abc"
});

export const defaultPackage: Package = Object.freeze({
  created: new Date(),
  owner: Object.assign({}, defaultOwner),
  name: "sample_package",
  updated: new Date(),
  url: "https://github.com/denoland/deno"
});
