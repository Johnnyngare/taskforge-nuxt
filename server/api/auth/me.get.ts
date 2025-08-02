// file: server/api/auth/me.get.ts

/**
 * Defines the event handler for the GET /api/auth/me endpoint.
 *
 * @param {object} event - The H3 event object, which contains request details.
 * @returns {object} A user object. Nuxt will automatically serialize this
 *                   to JSON and set the appropriate 'Content-Type' header.
 */
export default defineEventHandler((event) => {
  // In a real application, you would have logic here to verify an auth token
  // (e.g., from a cookie or Authorization header) and fetch the user's
  // data from a database.

  // For this example, we'll return a mock user.
  const user = {
    id: "user-123",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    avatar: "https://example.com/avatar.png",
  };

  return user;
});
