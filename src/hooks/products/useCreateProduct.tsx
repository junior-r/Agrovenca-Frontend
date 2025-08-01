import { createProduct } from '@/actions/products'
import { ProductsPaginatedResponse } from '@/types/product'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProductsQueryKey } from './useProductsQueryKey'
import { emptyPagination } from '@/lib/productEmptyPagination'

function useCreateProduct() {
  const filters = useProductsQueryKey()
  const queryClient = useQueryClient()

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onMutate: ({ newData }) => {
      const previousProducts = queryClient.getQueryData<ProductsPaginatedResponse>([
        'products',
        filters,
      ])
      const optimisticProduct = {
        ...newData,
        id: Math.random().toString(),
        slug: newData.name.toLowerCase().replace(/\s+/g, '-'),
        userId: Math.random().toString(),
        images: [],
        displayOrder: previousProducts?.objects.length ?? 0 + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      queryClient.setQueryData<ProductsPaginatedResponse>(['products', filters], (oldProducts) => {
        if (!oldProducts || !oldProducts.objects)
          return { objects: [optimisticProduct], pagination: emptyPagination }
        return {
          ...oldProducts,
          objects: [...oldProducts.objects, optimisticProduct],
        }
      })
      return { optimisticProduct }
    },
    onSuccess: ({ product: newProduct }, _variables, context) => {
      queryClient.setQueryData<ProductsPaginatedResponse>(['products', filters], (oldProducts) => {
        if (!oldProducts || !oldProducts.objects)
          return {
            pagination: emptyPagination,
            objects: [newProduct],
          }

        return {
          ...oldProducts,
          objects: oldProducts.objects.map((product) =>
            product.id === context?.optimisticProduct.id ? newProduct : product
          ),
        }
      })
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData<ProductsPaginatedResponse>(['products', filters], (oldProducts) => {
        if (!oldProducts || !oldProducts.objects)
          return { objects: [], pagination: emptyPagination }
        return {
          ...oldProducts,
          objects: oldProducts.objects.filter(
            (product) => product.id !== context?.optimisticProduct.id
          ),
        }
      })
    },
  })

  return { createProductMutation }
}

export default useCreateProduct
