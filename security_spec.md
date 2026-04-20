# Security Specification for Onusandhan

## Data Invariants
1. A user can only access their own profile and drive items.
2. Only an Admin can view all users and their metadata.
3. Documents and Links must have a valid `user_id` matching the owner.
4. Visibility must be one of 'Private' or 'Public'.

## The Dirty Dozen (Test Payloads)
1. **Identity Spoofing**: Attempt to create a `drive_item` for `userB` while logged in as `userA`.
2. **Privilege Escalation**: Scholar trying to set their own role to 'Admin' during registration.
3. **Ghost Field Injection**: Adding `is_verified: true` to a profile update to bypass verification tags.
4. **ID Poisoning**: Using a 2KB string as a `userId` to cause indexing bloat.
5. **Orphaned Record**: Creating a `drive_item` without a matching `user` document.
6. **Cross-User Leak**: Authenticated scholar trying to list `drive_items` of another scholar.
7. **Role Hijacking**: User A trying to update the email of User B.
8. **Terminal State Break**: (Not applicable yet, no terminal states like 'Archived' implemented).
9. **Size Attack**: Uploading a `title` string of 100KB.
10. **Resource Exhaustion**: Creating 10,000 links in a single batch (Rule should limit size if possible, but Firestore limits apply).
11. **Type Mismatch**: Sending `created_at` as a string instead of a number.
12. **Null Bypass**: Sending a `null` for a required field like `category`.

## Test Plan
Tests will be implemented in `firestore.rules.test.ts` using the Firebase Rules Emulator (simulated conceptually for this environment).
