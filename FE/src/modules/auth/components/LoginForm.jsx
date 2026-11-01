import { useState } from "react";
import { login } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import GoogleLoginButton from "./GoogleLogin";

function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const navigate = useNavigate();
	const {login: saveLogin} = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();

		setError("");
		setLoading(true);

		try {
			const response = await login(email, password);

			console.log("Login response:", response);

			// Lưu token
			const token = response.data.token;
			localStorage.setItem("token", token);

			const user = response.data.user;

			if (!user) {
				throw new Error("Không tìm thấy thông tin người dùng.");
			}

			saveLogin({ token, user });

			if (user.role === "ADMIN") {
				navigate("/admin/dashboard");
			} else {
				navigate("/", { replace: true });
			}
		} catch (error) {
			setError(error.message || "Đăng nhập thất bại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			{/* Email */}
			<div>
				<label
					htmlFor="email"
					className="mb-2 block text-sm font-medium text-gray-700"
				>
					Email
				</label>

				<input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="abc@vticket.com"
					className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
					required
				/>
			</div>

			{/* Password */}
			<div>
				<div className="mb-2 flex items-center justify-between">
					<label
						htmlFor="password"
						className="text-sm font-medium text-gray-700"
					>
						Password
					</label>

					<Link
						to="/forgot-password"
						className="text-sm text-blue-600 hover:text-blue-700"
					>
						Quên mật khẩu?
					</Link>
				</div>

				<input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Mật khẩu"
					className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
					required
				/>
			</div>

			{/* Error */}
			{error && (
				<p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
					{error}
				</p>
			)}

			{/* Button */}
			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? "Đang đăng nhập..." : "Đăng nhập"}
			</button>

			<p className="text-center text-sm text-gray-500">hoặc</p>

			{/* Login with Google */}
			<GoogleLoginButton />
		</form>
	);
}

export default LoginForm;
