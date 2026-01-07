import { useQuery } from "@tanstack/react-query";
import { ImageItem } from "@mirror-ball/shared-schemas/image.ts";

type useImagesProps = {
  token: string;
  apiBase: string;
};

export const useImages = ({ token, apiBase }: useImagesProps) => {
  const query = useQuery({
    queryKey: ["images", token],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      return data.items as ImageItem[];
    },
    enabled: !!token,
  });

  return {
    images: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
