import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = () => {
    alert("Signup success");
    navigate("/");
  };

  return (
    <div className="center">
      <div className="card">
        <h2>Sign Up</h2>
        <input placeholder="Name" />
        <input placeholder="Email" />
        <input placeholder="Password" type="password" />
        <input placeholder="Confirm Password" type="password" />

        <button onClick={handleSignup}>SIGN UP</button>

        <p onClick={() => navigate("/")}>
          Already have account? Login
        </p>
      </div>
    </div>
  );
}