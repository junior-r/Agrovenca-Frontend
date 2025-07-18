import { apiWithCredentials, apiWithOutCredentials } from '@/actions/api'
import { CouponCreateSchema, CouponUpdateSchema } from '@/schemas/coupons'
import { CouponApplyRequest, CouponType } from '@/types/coupon'
import axios from 'axios'
import { z } from 'zod'

export const getAllCoupons = async (): Promise<CouponType[]> => {
  try {
    const { data } = await apiWithOutCredentials.get(`/coupons`, {})
    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || { error: 'An unknown error occurred' }
    }
    throw new Error('An unknown error occurred')
  }
}

export const getCoupon = async (couponCode: string) => {
  try {
    const res = await apiWithCredentials.get(`/coupons/${couponCode}`, {})
    return res
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || { error: 'An unknown error occurred' }
    }
    return { error: 'An unknown error occurred' }
  }
}

export const create = async (data: z.infer<typeof CouponCreateSchema>) => {
  try {
    const res = await apiWithCredentials.post(`/coupons`, data, {})
    return res
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || { error: 'An unknown error occurred' }
    }
    return { error: 'An unknown error occurred' }
  }
}

export const update = async (id: string, data: z.infer<typeof CouponUpdateSchema>) => {
  try {
    const res = await apiWithCredentials.patch(`/coupons/${id}`, data, {})
    return res
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || { error: 'An unknown error occurred' }
    }
    return { error: 'An unknown error occurred' }
  }
}

export const destroy = async (id: string) => {
  try {
    const res = await apiWithCredentials.delete(`/coupons/${id}`, {})
    return res
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || { error: 'An unknown error occurred' }
    }
    return { error: 'An unknown error occurred' }
  }
}

export const applyCoupon = async (data: CouponApplyRequest) => {
  try {
    const res = await apiWithCredentials.post(`/coupons/apply/`, data)
    return res
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || { error: 'An unknown error occurred' }
    }
    return { error: 'An unknown error occurred' }
  }
}
