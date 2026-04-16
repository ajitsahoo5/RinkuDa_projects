import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("auth");
    navigate("/");
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Farmer App</h3>
        <p>Dashboard</p>
      </div>

      {/* Main */}
      <div className="main">
        <h2>Farmer Dashboard</h2>

        <button onClick={logout}>Logout</button>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Loan</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                <td>Farmer {i + 1}</td>
                <td>{10000 + i * 500}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}