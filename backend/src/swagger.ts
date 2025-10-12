const normalizeServerUrl = (value: string) => {
  if (!value) return value;
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const baseServer =
  normalizeServerUrl(process.env.APP_BASE_URL ?? '') ||
  `http://localhost:${process.env.PORT ?? 3000}`;

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MATIS SACCO API',
    version: '1.0.0',
    description:
      'API documentation for the MATIS SACCO platform. All secured endpoints require a valid JWT bearer token obtained from the login endpoint.',
    contact: {
      name: 'MATIS SACCO Engineering',
      email: 'support@matis-sacco.example'
    }
  },
  servers: [
    {
      url: baseServer,
      description: 'Current server'
    }
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Admin Dashboard', description: 'Aggregated dashboards for administrators' },
    { name: 'Admin Users', description: 'Administrative member management' },
    { name: 'Matatus', description: 'Vehicle and route management' },
    { name: 'Finance', description: 'Financial dashboards and reporting' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', example: 'Secret123!' }
        }
      },
      AuthTokenResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT bearer token' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      AdminUserSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          memberNumber: { type: ['string', 'null'] },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: ['string', 'null'] },
          statusCode: { type: 'string', enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'] },
          status: { type: 'string' },
          profileCategoryLabel: { type: ['string', 'null'] },
          membershipTypeLabel: { type: ['string', 'null'] },
          shareCapital: { type: ['number', 'null'] },
          savingsBalance: { type: ['number', 'null'] },
          loanBalance: { type: ['number', 'null'] },
          totalDeposits: { type: ['number', 'null'] },
          role: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] }
            }
          },
          vehicles: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AdminVehicleSummary'
            }
          }
        }
      },
      AdminVehicleSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          plateNumber: { type: 'string' },
          model: { type: ['string', 'null'] },
          vehicleType: { type: ['string', 'null'] },
          yearOfManufacture: { type: ['integer', 'null'] },
          statusCode: { type: 'string' },
          registrationStatusCode: { type: 'string' },
          insuranceStatusCode: { type: 'string' },
          owner: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              phone: { type: ['string', 'null'] }
            }
          },
          driver: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              phone: { type: ['string', 'null'] }
            }
          },
          metrics: {
            type: 'object',
            properties: {
              savingsBalance: { type: 'number' },
              outstandingLoanAmount: { type: 'number' },
              activeLoanCount: { type: 'integer' }
            }
          },
          lastPayment: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              amount: { type: ['number', 'null'] }
            }
          }
        }
      },
      AdminLoanSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: ['number', 'null'] },
          statusCode: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'REPAID', 'DEFAULTED']
          },
          typeCode: { type: 'string' },
          applicationDate: { type: 'string', format: 'date-time' },
          applicant: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              phone: { type: ['string', 'null'] }
            }
          },
          vehicle: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              plateNumber: { type: 'string' }
            }
          }
        }
      },
      AdminInsuranceSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vehicleId: { type: 'string' },
          statusCode: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'PENDING'] },
          premiumAmount: { type: ['number', 'null'] },
          policyType: { type: ['string', 'null'] },
          provider: { type: ['string', 'null'] },
          startDate: { type: ['string', 'null'], format: 'date-time' },
          expiryDate: { type: ['string', 'null'], format: 'date-time' },
          daysToExpiry: { type: ['integer', 'null'] },
          vehicle: {
            type: ['object', 'null'],
            properties: {
              id: { type: 'string' },
              plateNumber: { type: 'string' },
              owner: {
                type: ['object', 'null'],
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  phone: { type: ['string', 'null'] }
                }
              }
            }
          }
        }
      },
      VehicleDashboardCard: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          plate: { type: 'string' },
          route: { type: 'string' },
          driver: { type: 'string' },
          savings: { type: 'number' },
          loan: { type: 'number' },
          insurance: { type: 'string' },
          lastPayment: { type: ['string', 'null'], format: 'date-time' },
          paymentAmount: { type: 'number' },
          model: { type: 'string' },
          year: { type: ['integer', 'null'] }
        }
      },
      AvailableDriver: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          phone: { type: ['string', 'null'] }
        }
      },
      SetUserStatusRequest: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'],
            example: 'SUSPENDED'
          }
        }
      },
      ApproveUserRequest: {
        type: 'object',
        required: ['roleId'],
        properties: {
          roleId: {
            type: 'string',
            description: 'Identifier of the role to assign prior to activation',
            example: 'role-uuid'
          }
        }
      },
      AssignDriverRequest: {
        type: 'object',
        required: ['driverId'],
        properties: {
          driverId: { type: 'string', format: 'uuid' }
        }
      },
      CreateAdminUserRequest: {
        type: 'object',
        required: ['fullName', 'email'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: ['string', 'null'] },
          status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'] },
          roleId: { type: ['string', 'null'] },
          profileCategory: { type: ['string', 'null'] },
          membershipType: { type: ['string', 'null'] },
          shareCapital: { type: ['number', 'null'] },
          savingsBalance: { type: ['number', 'null'] }
        }
      }
    }
  },
  paths: {
    '/api/users/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a user and obtain a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Authentication succeeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokenResponse' }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
            }
          }
        }
      }
    },
    '/api/admin/dashboard/users': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Get aggregated user metrics and summaries',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AdminUserSummary' }
                    },
                    totals: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        byStatus: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/dashboard/vehicles': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Get aggregated vehicle metrics and summaries',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Vehicle dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AdminVehicleSummary' }
                    },
                    totals: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        byStatus: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        },
                        metrics: {
                          type: 'object',
                          properties: {
                            savingsBalance: { type: 'number' },
                            outstandingLoanAmount: { type: 'number' },
                            activeLoanCount: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/dashboard/loans': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Get aggregated loan metrics and summaries',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Loan dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AdminLoanSummary' }
                    },
                    totals: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        sum: { type: 'number' },
                        outstanding: { type: 'number' },
                        byStatus: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/dashboard/insurance': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Get aggregated insurance metrics and summaries',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Insurance dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AdminInsuranceSummary' }
                    },
                    totals: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        expiringSoon: { type: 'integer' },
                        byStatus: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin Users'],
        summary: 'List users with optional filters',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE']
            }
          },
          {
            name: 'roleId',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'User list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AdminUserSummary' }
                    },
                    total: { type: 'integer' },
                    appliedFilters: {
                      type: 'object',
                      properties: {
                        status: { type: ['string', 'null'] },
                        roleId: { type: ['string', 'null'] },
                        search: { type: ['string', 'null'] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Admin Users'],
        summary: 'Create a new user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAdminUserRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/AdminUserSummary' },
                    temporaryPassword: { type: 'string', nullable: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/admin/users/{userId}': {
      get: {
        tags: ['Admin Users'],
        summary: 'Get a single user by id',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminUserSummary' }
              }
            }
          },
          '404': { description: 'User not found' }
        }
      },
      patch: {
        tags: ['Admin Users'],
        summary: 'Update an existing user',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Any subset of user fields to update'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Updated user summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminUserSummary' }
              }
            }
          },
          '404': { description: 'User not found' }
        }
      }
    },
    '/api/admin/users/{userId}/approve': {
      post: {
        tags: ['Admin Users'],
        summary: 'Mark a user as active',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApproveUserRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Updated user summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminUserSummary' }
              }
            }
          },
          '404': { description: 'User not found' }
        }
      }
    },
    '/api/admin/users/{userId}/reject': {
      post: {
        tags: ['Admin Users'],
        summary: 'Change a user status (e.g. suspend)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SetUserStatusRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Updated user summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminUserSummary' }
              }
            }
          },
          '404': { description: 'User not found' }
        }
      }
    },
    '/api/matatus/dashboard-cards': {
      get: {
        tags: ['Matatus'],
        summary: 'Get dashboard cards for the authenticated vehicle owner',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard cards',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/VehicleDashboardCard' }
                }
              }
            }
          }
        }
      }
    },
    '/api/matatus/userVehicles/summary': {
      get: {
        tags: ['Matatus'],
        summary: 'Get lightweight summaries for the authenticated owner',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Vehicle summaries',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      plate: { type: 'string' },
                      savings: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/matatus/{id}/assignDriver': {
      post: {
        tags: ['Matatus'],
        summary: 'Assign a driver to a vehicle',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssignDriverRequest' }
            }
          }
        },
        responses: {
          '201': { description: 'Driver assigned successfully' },
          '400': { description: 'Validation error' },
          '404': { description: 'Vehicle or driver not found' }
        }
      }
    },
    '/api/matatus/routes': {
      get: {
        tags: ['Matatus'],
        summary: 'List available routes',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Route list' }
        }
      }
    },
    '/api/finance/dashboard/{userId}/recent-transactions': {
      get: {
        tags: ['Finance'],
        summary: 'Get recent transactions for dashboard widgets',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 50 }
          }
        ],
        responses: {
          '200': { description: 'Recent transactions' },
          '403': { description: 'Forbidden for other users' }
        }
      }
    },
    '/api/docs.json': {
      get: {
        tags: ['Auth'],
        summary: 'Retrieve the OpenAPI specification as JSON',
        responses: {
          '200': { description: 'OpenAPI document' }
        }
      }
    }
  }
};

export default swaggerDocument;
