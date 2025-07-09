interface NavigationProps {
  user?: __esri.PortalUser;
}
const Navigation: React.FC<NavigationProps> = ({ user }) => {
  return (
    <calcite-navigation slot="header">
      <calcite-navigation-logo
        slot="logo"
        thumbnail="./assets/logo.svg"
        href="https://raleighnc.gov"
        target="_blank"
        heading="Street Name Application"
      ></calcite-navigation-logo>
      {user && (
        <calcite-navigation-user
          slot="user"
          full-name={user.fullName}
          username={user.username}
          thumbnail={user.thumbnailUrl as string | undefined}
        ></calcite-navigation-user>
      )}
    </calcite-navigation>
  );
};

export default Navigation;
