import OAuthInfo from "@arcgis/core/identity/OAuthInfo.js";
import esriId from "@arcgis/core/identity/IdentityManager.js";
import Portal from "@arcgis/core/portal/Portal.js";

const useAuthentication = () => {
  const info = new OAuthInfo({
    appId: "7k3tRKvlgWz5AS1B",
    flowType: "auto",
    popup: false,
    portalUrl: "https://ral.maps.arcgis.com",
  });
  esriId.registerOAuthInfos([info]);


  const checkAuthentication = async () : Promise<__esri.PortalUser> => {
    try {
      // Check the sign-in status

      // await esriId.checkSignInStatus(`${info.portalUrl}/sharing`);
      // Get the credentials after successful sign-in
      const creds = await esriId.getCredential(`${info.portalUrl}/sharing`);

      // Query users from the portal
      const portal = new Portal({ url: info.portalUrl });
      const users = await portal.queryUsers({
        query: `username: ${creds.userId}`,
      });

      // Return user and credentials if a user is found
      if (users.results.length) {
        return users.results.at(0);
        //return { user: users.results[0], creds };
      } else {
        throw new Error("User not found.");
      }
    } catch (error) {
      // Log the error for debugging purposes
      console.error("Authentication check failed:", error);
      throw error; // Optionally rethrow the error for further handling
    }
  };

  return { checkAuthentication };
};

export default useAuthentication;
