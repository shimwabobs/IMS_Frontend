import { useEffect, useState } from "react";
import axios from "axios";
import { configDotenv } from "dotenv";
configDotenv();

type Method = "GET" | "POST" | "PUT" | "DELETE";

const useFetch = <T = unknown>(url: string, method: Method) => {
    const [result, setResult] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const fetchData = async (data?: any) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let response;
            switch (method.toUpperCase()) {
                case "POST":
                    response = await axios.post(process.env.NEXT_PUBLIC_API_URL+url, data, { withCredentials: true });
                    break;
                case "PUT":
                    response = await axios.put(url, data, { withCredentials: true });
                    break;
                case "DELETE":
                    response = await axios.delete(url, { withCredentials: true });
                    break;
                case "GET":
                    response = await axios.get(url, { withCredentials: true });
                    break;
                default:
                    throw new Error("Unsupported method");
            }

            if (response.status >= 200 && response.status < 300) {
                setResult(response.data); 
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (error) {
            timer = setTimeout(() => setError(null), 10000);
        }
        return () => clearTimeout(timer);
    }, [error]);

    return { result, error, success, loading, fetchData };
};

export default useFetch;
