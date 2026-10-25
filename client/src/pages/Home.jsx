import { useAuth } from "../context/AuthContext";
import ClientHome from "./ClientHome";
import StaffHome from "./StaffHome";

export default function Home() {
  const { user } = useAuth();
  return user.role === "client" ? <ClientHome /> : <StaffHome />;
}