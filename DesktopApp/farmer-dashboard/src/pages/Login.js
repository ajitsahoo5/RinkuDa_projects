import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("auth", "true");
    navigate("/dashboard");
  };

  return (
    <div className="center">
      <div className="card">
        <h2>Login</h2>
        <input placeholder="Email" />
        <input placeholder="Password" type="password" />

        <button onClick={handleLogin}>LOGIN</button>

        <p onClick={() => navigate("/signup")}>
          Don't have account? Sign up
        </p>
      </div>
    </div>
  );
}