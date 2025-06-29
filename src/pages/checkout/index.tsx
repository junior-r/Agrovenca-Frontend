import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { ModeToggle } from '@/components/mode-toggle'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useCartStore } from '@/store/cart/useCartStore'
import { Product } from '@/types/product'
import {
  ArrowLeftIcon,
  Building2,
  CreditCard,
  EllipsisIcon,
  Leaf,
  LockIcon,
  Tag,
  TrashIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import ProductImagePlaceholder from '@/assets/images/productImagePlaceholder.png'
import { validateCart } from '@/actions/products'
import { CartItem } from '@/types/cart'
import UpdateCartItem from '../products/UpdateCartItem'
import { Button } from '@/components/ui/button'
import { generateRandomHexString, pluralize } from '@/lib/utils'
import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CouponApplySchema } from '@/schemas/coupons'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import ShippingAddress from './shippingAddress'

const TAX_VALUE = 0.12

type ValidatedCartItems = CartItem & {
  valid: boolean
  reason?: string
  availableStock?: number
}

interface InvalidCartItem {
  productId: string
  reason: string
}

function CheckOutPage() {
  const navigate = useNavigate()
  const [isLoading, _setIsLoading] = useState(false)
  const [invalidItems, setInvalidItems] = useState<InvalidCartItem[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')

  const cartItems = useCartStore((state) => state.items)
  const updateItem = useCartStore((state) => state.updateItem)
  const deleteItem = useCartStore((state) => state.deleteItem)

  const orderNumber = useMemo(() => {
    return generateRandomHexString() + '-' + cartItems.length.toString()
  }, [cartItems.length])

  const getProductPrice = (product: Product) =>
    product.secondPrice && product.secondPrice != 0 ? product.secondPrice : product.price
  const productImage = (product: Product) => product.images[0]?.s3Key || ProductImagePlaceholder
  const subtotal = cartItems
    .map((i) => getProductPrice(i.product) * i.quantity)
    .reduce((acc, price) => acc + price, 0)
  const tax = subtotal * TAX_VALUE
  const total = subtotal + tax

  const couponForm = useForm<z.infer<typeof CouponApplySchema>>({
    resolver: zodResolver(CouponApplySchema),
    defaultValues: {
      code: '',
    },
  })

  const onSubmitCoupon: SubmitHandler<z.infer<typeof CouponApplySchema>> = (data) => {}

  const applyCoupon = () => {
    setCouponError('')
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  useEffect(() => {
    if (!cartItems) {
      navigate('/products')
    }
  }, [cartItems, navigate])

  useEffect(() => {
    const fetchProducts = async () => {
      const items = cartItems.map(({ productId, quantity }) => ({
        productId,
        quantity,
      }))

      try {
        const res = await validateCart({ items })

        if (res.status !== 200) return

        const validatedItems: ValidatedCartItems[] = res.data.items
        const invalids = validatedItems.filter((i) => !i.valid)

        setInvalidItems(
          invalids.map(({ productId, reason }) => ({
            productId,
            reason: reason ?? '',
          }))
        )

        const updateMap = new Map<string, number>()

        invalids.forEach((item) => {
          const availableStock = item.availableStock ?? 0
          if (availableStock > 0) {
            updateMap.set(item.productId, availableStock)
          } else {
            deleteItem(item.productId)
          }
        })

        cartItems.forEach((cartItem) => {
          const newQty = updateMap.get(cartItem.productId)
          if (newQty !== undefined && newQty !== cartItem.quantity) {
            updateItem({ ...cartItem, quantity: newQty })
          }
        })
      } catch (error) {
        console.log(error)
      }
    }
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full gap-2">
        <Loader size="md" />
        <span>Cargando...</span>
      </div>
    )
  }
  return (
    <div>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto">
          <Link to={'/'} className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">Agrovenca</span>
          </Link>
          <div className="flex items-center gap-4">
            <LockIcon className="w-5 h-5" />
            <span className="text-sm text-muted-foreground">Secure Checkout</span>
          </div>
          <ModeToggle />
        </div>
      </header>
      <section className="container mx-auto py-4 px-2">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a los productos
        </Link>
        <h2 className="my-4 text-2xl text-center">
          Número de orden <span className="text-yellow-500">{orderNumber}</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                    1
                  </div>
                  Dirección de envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ShippingAddress />
              </CardContent>
            </Card>
            {/* Coupon Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                    2
                  </div>
                  Código de cupón
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">code</p>
                        <p className="text-sm text-green-600">description</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-700"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Form {...couponForm}>
                    <form className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ingresa un código de cupón"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 font-serif"
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          onClick={applyCoupon}
                          disabled={!couponCode.trim()}
                          className={
                            'font-serif' + !couponCode.trim()
                              ? 'cursor-pointer'
                              : 'cursor-not-allowed'
                          }
                        >
                          Aplicar
                        </Button>
                      </div>
                      {couponError && (
                        <Alert variant="destructive">
                          <AlertDescription>{couponError}</AlertDescription>
                        </Alert>
                      )}
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                    3
                  </div>
                  Método de pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-md font-serif">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4" />
                      Tarjeta de Débito/Crédito
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md font-serif">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label
                      htmlFor="transfer"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Building2 className="h-4 w-4" />
                      Transferencia bancaria
                    </Label>
                  </div>
                </RadioGroup>
                {paymentMethod === 'transfer' && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h4 className="font-medium mb-2">Bank Transfer Details</h4>
                    <div className="space-y-2 text-sm font-serif">
                      <p>
                        <strong>Nombre de banco:</strong> AgriMarket Bank
                      </p>
                      <p>
                        <strong>Nombre de la cuenta:</strong> AgriMarket LLC
                      </p>
                      <p>
                        <strong>Número de cuenta:</strong> 1234567890
                      </p>
                      <p>
                        <strong>RIF:</strong> 987654321
                      </p>
                      <p className="text-muted-foreground mt-3">
                        Por favor incluye el número de tu órden en la referencia de la tranferencia.
                        Tu orden será procesada una vez que el pago sea confirmado.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            {invalidItems.length > 0 && (
              <>
                <div className="mb-4 p-3 border border-red-300 bg-red-50 rounded">
                  <div className="ml-5 text-sm text-red-700">
                    <p>
                      La cantidad de {invalidItems.length}{' '}
                      {pluralize('producto', invalidItems, 's')}
                      {pluralize('fue', invalidItems, 'ron')}
                      {pluralize('decrementada', invalidItems, 's')}
                      por insuficiencia de stock
                    </p>
                  </div>
                </div>
                <Separator className="mb-4" />
              </>
            )}

            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumen de la orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-start gap-3 relative">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            loading="lazy"
                            alt={item.product.name}
                            src={productImage(item.product)}
                            className="rounded-md object-cover w-15 h-15"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = ProductImagePlaceholder
                            }}
                          />
                          <Badge className="absolute font-serif -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-600">
                            {item.quantity}
                          </Badge>
                        </div>
                        <div className="w-full flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground font-serif">
                            ${Number(getProductPrice(item.product)).toFixed(2)} cada uno
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <p className="font-medium font-serif">
                          ${(getProductPrice(item.product) * item.quantity).toFixed(2)}
                        </p>
                        <Popover>
                          <PopoverTrigger className="">
                            <EllipsisIcon />
                          </PopoverTrigger>
                          <PopoverContent className="flex justify-center items-center gap-4 flex-col w-fit">
                            <UpdateCartItem iconOnly={false} item={item} />
                            <Button
                              className="cursor-pointer w-full"
                              variant={'destructive'}
                              onClick={() => deleteItem(item.productId)}
                            >
                              <TrashIcon className="w-5 h-5" />
                              <span>Eliminar</span>
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-serif">${subtotal.toFixed(2)}</span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                  </div> */}
                  <div className="flex justify-between">
                    <span>Impuesto ({TAX_VALUE * 100}%)</span>
                    <span className="font-serif">${tax.toFixed(2)}</span>
                  </div>
                  {/* {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )} */}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="font-serif">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* {shipping === 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                    <Check className="h-4 w-4" />
                    <span>Free shipping on orders over $25!</span>
                  </div>
                )} */}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CheckOutPage
