import { useState } from "react";
import api from "../services/api";

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		try {
			setLoading(true);
			
			const { data } = await api.post(
				"/auth/forgot-password",
				{ email }
			);

			setMessage(data.message || "Reset link sent to your email");
		} catch (err) {
			setMessage(
				err.response?.data?.message ||
				"Failed to send reset link"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-black text-white">
			<div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl shadow-lg">
				<h1 className="text-3xl font-bold mb-6 text-center">
					Forgot Password
				</h1>

				<form onSubmit={handleSubmit} className="space-y-4">
					<input
						type="email"
						placeholder="Enter your email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
						required
					/>

					<button 
						type="submit"
						disabled={loading}
						className="w-full p-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition">
						{loading ? "Sending..." : "Send Reset Link"}
					</button>
				</form>

				{message && (
					<p className="mt-4 text-center text-sm text-zinc-300">
						{message}
					</p>
				)}
			</div>
		</div>
	);
}
